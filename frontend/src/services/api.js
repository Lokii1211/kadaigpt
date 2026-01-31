// Complete API Configuration and Service with Offline Sync
// Uses relative URL for same-host deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// IndexedDB for offline storage
const DB_NAME = 'KadaiGPT_DB'
const DB_VERSION = 1

class OfflineStorageService {
    constructor() {
        this.db = null
        this.init()
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
                this.db = request.result
                resolve(this.db)
            }

            request.onupgradeneeded = (event) => {
                const db = event.target.result

                // Create object stores
                if (!db.objectStoreNames.contains('bills')) {
                    db.createObjectStore('bills', { keyPath: 'id', autoIncrement: true })
                }
                if (!db.objectStoreNames.contains('products')) {
                    db.createObjectStore('products', { keyPath: 'id', autoIncrement: true })
                }
                if (!db.objectStoreNames.contains('customers')) {
                    db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true })
                }
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' })
                }
            }
        })
    }

    async save(storeName, data) {
        await this.init()
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.put(data)
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async getAll(storeName) {
        await this.init()
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly')
            const store = tx.objectStore(storeName)
            const request = store.getAll()
            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
        })
    }

    async delete(storeName, id) {
        await this.init()
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite')
            const store = tx.objectStore(storeName)
            const request = store.delete(id)
            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
        })
    }

    async addToSyncQueue(action) {
        await this.save('syncQueue', { ...action, timestamp: Date.now() })
    }

    async processSyncQueue() {
        const queue = await this.getAll('syncQueue')
        for (const item of queue) {
            try {
                // Process sync item
                await this.delete('syncQueue', item.id)
            } catch (error) {
                console.error('Sync failed:', error)
            }
        }
    }
}

const offlineStorage = new OfflineStorageService()

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL
        this.token = localStorage.getItem('kadai_token')
        console.log('[API] Initialized with token:', this.token ? 'token exists' : 'no token')

        // Listen for online/offline events
        window.addEventListener('online', () => this.syncOfflineData())
    }

    setToken(token) {
        console.log('[API] setToken called:', token ? 'setting token' : 'clearing token')
        this.token = token
        if (token) {
            localStorage.setItem('kadai_token', token)
            console.log('[API] Token saved to localStorage')
        } else {
            localStorage.removeItem('kadai_token')
            console.log('[API] Token removed from localStorage')
        }
    }

    getToken() {
        const token = this.token || localStorage.getItem('kadai_token')
        return token
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        const token = this.getToken()
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
            console.log('[API] Request to', endpoint, '- Token attached')
        } else {
            console.log('[API] Request to', endpoint, '- NO TOKEN!')
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            })

            // Handle 401 - log details first
            if (response.status === 401) {
                const data = await response.json().catch(() => ({}))
                console.error('[API] 401 Error on', endpoint, 'Details:', data)

                // Only clear token if it's an auth validation failure, not just missing token
                // Don't clear on login/register endpoints as those fail for different reasons
                if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
                    console.log('[API] Clearing token due to 401 on protected endpoint')
                    this.setToken(null)
                }
                throw new Error(data.detail || 'Authentication required')
            }

            const data = await response.json()

            if (!response.ok) {
                // Handle Pydantic validation errors
                if (data.detail && Array.isArray(data.detail)) {
                    const messages = data.detail.map(err => err.msg || err.message || JSON.stringify(err))
                    throw new Error(messages.join(', '))
                }
                throw new Error(data.detail || data.message || 'Request failed')
            }

            return data
        } catch (error) {
            // If offline, queue the request
            if (!navigator.onLine && options.method !== 'GET') {
                await offlineStorage.addToSyncQueue({
                    endpoint,
                    options,
                    type: 'api_request'
                })
                throw new Error('Offline - Request queued for sync')
            }
            throw error
        }
    }

    async syncOfflineData() {
        if (navigator.onLine) {
            await offlineStorage.processSyncQueue()
        }
    }

    // Auth endpoints
    async login(username, password) {
        const formData = new URLSearchParams()
        formData.append('username', username)
        formData.append('password', password)

        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
            // Handle Pydantic validation errors (array format)
            if (Array.isArray(data.detail)) {
                const messages = data.detail.map(err => err.msg || err.message || JSON.stringify(err))
                throw new Error(messages.join(', '))
            }
            // Handle string error messages
            throw new Error(typeof data.detail === 'string' ? data.detail : 'Login failed')
        }

        this.setToken(data.access_token)
        return data
    }

    async register(userData) {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        })

        const data = await response.json()

        if (!response.ok) {
            // Handle Pydantic validation errors (array format)
            if (Array.isArray(data.detail)) {
                const messages = data.detail.map(err => err.msg || err.message || JSON.stringify(err))
                throw new Error(messages.join(', '))
            }
            // Handle string error messages
            throw new Error(typeof data.detail === 'string' ? data.detail : 'Registration failed')
        }

        return data
    }

    async getProfile() {
        return this.request('/auth/me')
    }

    logout() {
        this.token = null
        // Clear all auth and user data from localStorage
        localStorage.removeItem('kadai_token')
        localStorage.removeItem('kadai_store_name')
        localStorage.removeItem('kadai_gstin')
        localStorage.removeItem('kadai_demo_mode')
        localStorage.removeItem('kadai_store_address')
        localStorage.removeItem('kadai_store_phone')
    }

    // Products endpoints
    async getProducts() {
        try {
            return await this.request('/products')
        } catch {
            // Return from local storage if offline
            return await offlineStorage.getAll('products')
        }
    }

    async createProduct(product) {
        const result = await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(product),
        })
        await offlineStorage.save('products', result)
        return result
    }

    async updateProduct(id, product) {
        const result = await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(product),
        })
        await offlineStorage.save('products', result)
        return result
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}`, {
            method: 'DELETE',
        })
    }

    // Bills endpoints
    async getBills(params = {}) {
        const query = new URLSearchParams(params).toString()
        try {
            return await this.request(`/bills?${query}`)
        } catch {
            return await offlineStorage.getAll('bills')
        }
    }

    async createBill(billData) {
        try {
            const result = await this.request('/bills', {
                method: 'POST',
                body: JSON.stringify(billData),
            })
            await offlineStorage.save('bills', result)
            return result
        } catch (error) {
            // Save locally if offline
            if (!navigator.onLine) {
                const offlineBill = {
                    ...billData,
                    id: `offline_${Date.now()}`,
                    bill_number: `OFF-${Date.now().toString().slice(-6)}`,
                    created_at: new Date().toISOString(),
                    synced: false
                }
                await offlineStorage.save('bills', offlineBill)
                return offlineBill
            }
            throw error
        }
    }

    async getBill(id) {
        return this.request(`/bills/${id}`)
    }

    // OCR endpoint
    async processOCR(imageFile, language = 'en') {
        const formData = new FormData()
        formData.append('file', imageFile)
        formData.append('language', language)

        const response = await fetch(`${this.baseUrl}/ocr/process`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`,
            },
            body: formData,
        })

        const data = await response.json()
        if (!response.ok) {
            throw new Error(data.detail || 'OCR processing failed')
        }

        return data
    }

    // Print endpoint
    async printBill(billData) {
        return this.request('/print/bill', {
            method: 'POST',
            body: JSON.stringify(billData),
        })
    }

    async getPreview(billData) {
        return this.request('/print/preview', {
            method: 'POST',
            body: JSON.stringify(billData),
        })
    }

    // Customer endpoints
    async getCustomers() {
        try {
            return await this.request('/customers')
        } catch {
            return await offlineStorage.getAll('customers')
        }
    }

    async createCustomer(customer) {
        const result = await this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customer),
        })
        await offlineStorage.save('customers', result)
        return result
    }

    async recordPayment(customerId, amount) {
        return this.request(`/customers/${customerId}/payment`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
        })
    }

    async addCredit(customerId, amount) {
        return this.request(`/customers/${customerId}/credit`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
        })
    }

    async deleteCustomer(customerId) {
        return this.request(`/customers/${customerId}`, {
            method: 'DELETE',
        })
    }

    // Supplier endpoints
    async getSuppliers() {
        return this.request('/suppliers')
    }

    async createSupplier(supplier) {
        return this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(supplier),
        })
    }

    async updateSupplier(supplierId, data) {
        return this.request(`/suppliers/${supplierId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async deleteSupplier(supplierId) {
        return this.request(`/suppliers/${supplierId}`, {
            method: 'DELETE',
        })
    }

    async getPurchaseOrders() {
        return this.request('/suppliers/orders/list')
    }

    async createPurchaseOrder(order) {
        return this.request('/suppliers/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        })
    }

    async updateOrderStatus(orderId, status) {
        return this.request(`/suppliers/orders/${orderId}/status?new_status=${status}`, {
            method: 'PUT',
        })
    }

    async recordSupplierPayment(supplierId, amount) {
        return this.request(`/suppliers/${supplierId}/payment`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
        })
    }
}

const api = new ApiService()
export default api
export { offlineStorage }

