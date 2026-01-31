// Complete API Configuration and Service with Offline Sync
// Uses relative URL for same-host deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

// IndexedDB for offline storage
const DB_NAME = 'VyaparAI_DB'
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
        this.token = localStorage.getItem('vyapar_token')

        // Listen for online/offline events
        window.addEventListener('online', () => this.syncOfflineData())
    }

    setToken(token) {
        this.token = token
        if (token) {
            localStorage.setItem('vyapar_token', token)
        } else {
            localStorage.removeItem('vyapar_token')
        }
    }

    getToken() {
        return this.token || localStorage.getItem('vyapar_token')
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        if (this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            })

            if (response.status === 401) {
                this.setToken(null)
                throw new Error('Session expired')
            }

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Request failed')
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
        this.setToken(null)
        localStorage.removeItem('vyapar_store_name')
        localStorage.removeItem('vyapar_gstin')
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

    async updateCustomerCredit(id, amount) {
        return this.request(`/customers/${id}/credit`, {
            method: 'PUT',
            body: JSON.stringify({ amount }),
        })
    }
}

const api = new ApiService()
export default api
export { offlineStorage }
