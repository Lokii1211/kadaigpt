/**
 * Real Data Service - Fetches real data from backend APIs
 * No more demo/dummy data - everything comes from the actual backend
 */

import api from './api'

class RealDataService {
    constructor() {
        this.cache = new Map()
        this.cacheTimeout = 60000 // 1 minute cache
    }

    // Clear all cache
    clearCache() {
        this.cache.clear()
    }

    // Get cached data or fetch new
    async getCached(key, fetchFn) {
        const cached = this.cache.get(key)
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data
        }

        const data = await fetchFn()
        this.cache.set(key, { data, timestamp: Date.now() })
        return data
    }

    // ==================== DASHBOARD DATA ====================
    async getDashboardStats() {
        try {
            const stats = await api.getDashboardStats()
            return {
                todaySales: stats?.today_sales || stats?.todaySales || 0,
                todayBills: stats?.today_bills || stats?.todayBills || 0,
                avgBillValue: stats?.avg_bill_value || stats?.avgBillValue || 0,
                lowStockCount: stats?.low_stock_count || stats?.lowStockCount || 0,
                customerCount: stats?.customer_count || 0,
                pendingOrders: stats?.pending_orders || 0
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error)
            return {
                todaySales: 0,
                todayBills: 0,
                avgBillValue: 0,
                lowStockCount: 0,
                customerCount: 0,
                pendingOrders: 0
            }
        }
    }

    async getDashboardActivity() {
        try {
            const activity = await api.getDashboardActivity()
            return Array.isArray(activity) ? activity : []
        } catch (error) {
            console.error('Failed to fetch activity:', error)
            return []
        }
    }

    // ==================== PRODUCTS DATA ====================
    async getProducts() {
        try {
            const response = await api.getProducts()
            const products = response?.products || response || []

            // Normalize product data
            return products.map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku || '',
                barcode: p.barcode || '',
                price: p.selling_price || p.price || 0,
                costPrice: p.cost_price || p.costPrice || 0,
                stock: p.current_stock || p.stock || 0,
                minStock: p.min_stock_alert || p.minStock || 10,
                unit: p.unit || 'piece',
                category: p.category?.name || p.category || 'General',
                categoryId: p.category_id || null,
                isActive: p.is_active !== false,
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }))
        } catch (error) {
            console.error('Failed to fetch products:', error)
            return []
        }
    }

    async getLowStockProducts() {
        try {
            const products = await this.getProducts()
            return products.filter(p => p.stock <= p.minStock)
        } catch (error) {
            return []
        }
    }

    // ==================== BILLS DATA ====================
    async getBills(params = {}) {
        try {
            const response = await api.getBills(params)
            const bills = response?.bills || response || []

            return bills.map(b => ({
                id: b.id,
                billNumber: b.bill_number || `BILL-${b.id}`,
                customerName: b.customer_name || b.customer?.name || 'Walk-in',
                customerId: b.customer_id,
                total: b.total_amount || b.total || 0,
                subtotal: b.subtotal || b.total || 0,
                tax: b.tax_amount || b.tax || 0,
                discount: b.discount_amount || b.discount || 0,
                paymentMethod: b.payment_method || 'cash',
                status: b.status || 'completed',
                items: b.items || [],
                createdAt: b.created_at,
                createdBy: b.created_by
            }))
        } catch (error) {
            console.error('Failed to fetch bills:', error)
            return []
        }
    }

    async getTodayBills() {
        const today = new Date().toISOString().split('T')[0]
        return this.getBills({ date: today })
    }

    // ==================== CUSTOMERS DATA ====================
    async getCustomers() {
        try {
            const response = await api.getCustomers()
            const customers = response?.customers || response || []

            return customers.map(c => ({
                id: c.id,
                name: c.name || c.full_name || '',
                phone: c.phone || '',
                email: c.email || '',
                address: c.address || '',
                totalPurchases: c.total_purchases || 0,
                totalSpent: c.total_spent || 0,
                loyaltyPoints: c.loyalty_points || 0,
                lastVisit: c.last_visit || c.updated_at,
                createdAt: c.created_at
            }))
        } catch (error) {
            console.error('Failed to fetch customers:', error)
            return []
        }
    }

    // ==================== ANALYTICS DATA ====================
    async getAnalytics(period = 'week') {
        try {
            const response = await api.getAnalytics?.(period) || {}

            return {
                totalSales: response.total_sales || 0,
                totalBills: response.total_bills || 0,
                avgBillValue: response.avg_bill_value || 0,
                growth: response.growth || 0,
                topProducts: response.top_products || [],
                salesByDay: response.sales_by_day || [],
                salesByHour: response.sales_by_hour || [],
                paymentBreakdown: response.payment_breakdown || {
                    cash: 0, upi: 0, card: 0, credit: 0
                }
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
            return {
                totalSales: 0,
                totalBills: 0,
                avgBillValue: 0,
                growth: 0,
                topProducts: [],
                salesByDay: [],
                salesByHour: [],
                paymentBreakdown: { cash: 0, upi: 0, card: 0, credit: 0 }
            }
        }
    }

    async getTopProducts(limit = 10) {
        try {
            const analytics = await this.getAnalytics()
            return analytics.topProducts.slice(0, limit)
        } catch (error) {
            return []
        }
    }

    // ==================== EXPENSES DATA ====================
    async getExpenses(params = {}) {
        try {
            const response = await api.getExpenses?.(params) || []
            return Array.isArray(response) ? response : response.expenses || []
        } catch (error) {
            console.error('Failed to fetch expenses:', error)
            return []
        }
    }

    async getExpenseSummary() {
        try {
            const expenses = await this.getExpenses()
            const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
            const byCategory = expenses.reduce((acc, e) => {
                const cat = e.category || 'Other'
                acc[cat] = (acc[cat] || 0) + (e.amount || 0)
                return acc
            }, {})

            return { total, byCategory, count: expenses.length }
        } catch (error) {
            return { total: 0, byCategory: {}, count: 0 }
        }
    }

    // ==================== SUPPLIERS DATA ====================
    async getSuppliers() {
        try {
            const response = await api.getSuppliers?.() || []
            return Array.isArray(response) ? response : response.suppliers || []
        } catch (error) {
            console.error('Failed to fetch suppliers:', error)
            return []
        }
    }

    // ==================== AI INSIGHTS ====================
    async getAIInsights() {
        try {
            const insights = await api.getAIInsights?.()
            return insights?.insights || []
        } catch (error) {
            return []
        }
    }

    async getAgentSuggestions() {
        try {
            const response = await api.getAgentSuggestions?.()
            return response?.suggestions || []
        } catch (error) {
            return []
        }
    }

    // ==================== DAILY SUMMARY ====================
    async getDailySummary(date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0]
            const [stats, bills, expenses] = await Promise.all([
                this.getDashboardStats(),
                this.getBills({ date: targetDate }),
                this.getExpenses({ date: targetDate })
            ])

            return {
                date: targetDate,
                totalSales: stats.todaySales,
                billCount: bills.length,
                avgBillValue: bills.length > 0
                    ? bills.reduce((sum, b) => sum + b.total, 0) / bills.length
                    : 0,
                totalExpenses: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                netProfit: stats.todaySales - expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
                topSellingProducts: await this.getTopProducts(5),
                paymentBreakdown: this.calculatePaymentBreakdown(bills)
            }
        } catch (error) {
            console.error('Failed to get daily summary:', error)
            return null
        }
    }

    calculatePaymentBreakdown(bills) {
        return bills.reduce((acc, bill) => {
            const method = bill.paymentMethod || 'cash'
            acc[method] = (acc[method] || 0) + bill.total
            return acc
        }, { cash: 0, upi: 0, card: 0, credit: 0 })
    }

    // ==================== STORE SETTINGS ====================
    async getStoreSettings() {
        try {
            return await api.getStoreSettings?.() || {}
        } catch (error) {
            return {}
        }
    }

    // ==================== LOYALTY & REWARDS ====================
    async getLoyaltyProgram() {
        try {
            return await api.getLoyaltyProgram?.() || {
                pointsPerRupee: 1,
                pointsValue: 0.1,
                tiers: []
            }
        } catch (error) {
            return { pointsPerRupee: 1, pointsValue: 0.1, tiers: [] }
        }
    }
}

// Export singleton instance
const realDataService = new RealDataService()
export default realDataService

// Named exports for specific data
export const {
    getDashboardStats,
    getDashboardActivity,
    getProducts,
    getLowStockProducts,
    getBills,
    getCustomers,
    getAnalytics,
    getExpenses,
    getSuppliers,
    getAIInsights,
    getDailySummary,
    getStoreSettings
} = realDataService
