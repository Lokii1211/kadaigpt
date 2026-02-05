import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Users, AlertTriangle, IndianRupee, Clock, FileText, Package, Plus, Camera, BarChart3, RefreshCw, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import realDataService from '../services/realDataService'
import WhatsAppAgentPanel from '../components/WhatsAppAgentPanel'
import AIInsightsPanel from '../components/AIInsightsPanel'

export default function Dashboard({ addToast, setCurrentPage }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayBills: 0,
    avgBillValue: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    creditPending: 0
  })
  const [products, setProducts] = useState([])
  const [bills, setBills] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Get user role
  const userRole = localStorage.getItem('kadai_user_role') || 'owner'
  const storeName = localStorage.getItem('kadai_store_name') || 'My Store'

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsData, productsData, billsData] = await Promise.all([
        realDataService.getDashboardStats(),
        realDataService.getProducts(),
        realDataService.getBills({ limit: 5 })
      ])

      setStats({
        todaySales: statsData.todaySales || 0,
        todayBills: statsData.todayBills || billsData.length || 0,
        avgBillValue: statsData.avgBillValue || 0,
        lowStockCount: productsData.filter(p => p.stock <= p.minStock).length || 0,
        totalCustomers: statsData.totalCustomers || 0,
        creditPending: statsData.creditPending || 0
      })

      setProducts(productsData)
      setBills(billsData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`
  const formatTime = () => currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const formatDate = () => currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

  const lowStockProducts = products.filter(p => p.stock <= p.minStock)

  const refresh = () => {
    setIsRefreshing(true)
    loadDashboardData().finally(() => {
      setIsRefreshing(false)
      addToast('Dashboard refreshed', 'success')
    })
  }

  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="dashboard-page">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-text">
          <h1>{getGreeting()}! 👋</h1>
          <p>{storeName} • {formatDate()}</p>
        </div>
        <div className="header-actions">
          <span className="current-time">{formatTime()}</span>
          <button className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`} onClick={refresh}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-actions">
        <button className="action-btn primary" onClick={() => setCurrentPage('create-bill')}>
          <Plus size={20} />
          <span>New Bill</span>
        </button>
        <button className="action-btn" onClick={() => setCurrentPage('products')}>
          <Package size={20} />
          <span>Products</span>
        </button>
        <button className="action-btn" onClick={() => setCurrentPage('customers')}>
          <Users size={20} />
          <span>Customers</span>
        </button>
        <button className="action-btn" onClick={() => setCurrentPage('bills')}>
          <FileText size={20} />
          <span>Bills</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card sales">
          <div className="stat-icon"><IndianRupee size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.todaySales)}</span>
            <span className="stat-label">Today's Sales</span>
          </div>
          <ArrowUpRight className="trend-icon up" size={16} />
        </div>

        <div className="stat-card bills">
          <div className="stat-icon"><ShoppingBag size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.todayBills}</span>
            <span className="stat-label">Bills Today</span>
          </div>
        </div>

        <div className="stat-card avg">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <span className="stat-value">{formatCurrency(stats.avgBillValue)}</span>
            <span className="stat-label">Avg Bill</span>
          </div>
        </div>

        {stats.lowStockCount > 0 && (
          <div className="stat-card warning" onClick={() => setCurrentPage('products')}>
            <div className="stat-icon"><AlertTriangle size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.lowStockCount}</span>
              <span className="stat-label">Low Stock</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Bills */}
        <div className="card recent-bills">
          <div className="card-header">
            <h3><FileText size={18} /> Recent Bills</h3>
            <button className="link-btn" onClick={() => setCurrentPage('bills')}>View All</button>
          </div>
          <div className="bills-list">
            {bills.length > 0 ? bills.map(bill => (
              <div key={bill.id} className="bill-item">
                <div className="bill-info">
                  <span className="bill-number">#{bill.bill_number}</span>
                  <span className="bill-customer">{bill.customer_name || 'Walk-in'}</span>
                </div>
                <div className="bill-amount">
                  <span className="amount">{formatCurrency(bill.total)}</span>
                  <span className={`payment-badge ${bill.payment_mode?.toLowerCase()}`}>
                    {bill.payment_mode || 'Cash'}
                  </span>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <FileText size={32} />
                <p>No bills yet</p>
                <button className="btn-primary" onClick={() => setCurrentPage('create-bill')}>
                  Create First Bill
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="card low-stock">
            <div className="card-header warning">
              <h3><AlertTriangle size={18} /> Low Stock Alert</h3>
              <span className="count-badge">{lowStockProducts.length}</span>
            </div>
            <div className="stock-list">
              {lowStockProducts.slice(0, 5).map(product => (
                <div key={product.id} className="stock-item">
                  <span className="product-name">{product.name}</span>
                  <span className={`stock-level ${product.stock === 0 ? 'out' : 'low'}`}>
                    {product.stock} left
                  </span>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <button className="see-more" onClick={() => setCurrentPage('products')}>
                  +{lowStockProducts.length - 5} more
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Features Section - Only for Owner/Admin */}
      {(userRole === 'owner' || userRole === 'admin') && (
        <div className="ai-section">
          <div className="section-header">
            <h2>🤖 AI Insights</h2>
            <span className="pro-badge">PRO</span>
          </div>
          <AIInsightsPanel addToast={addToast} />
          <WhatsAppAgentPanel addToast={addToast} />
        </div>
      )}

      {/* Staff View - Simplified */}
      {userRole === 'staff' && (
        <div className="staff-notice">
          <p>👋 Ready to serve customers! Use the buttons above to create bills and manage products.</p>
        </div>
      )}

      <style>{`
        .dashboard-page {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Welcome Header */
        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .welcome-text h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 4px;
        }

        .welcome-text p {
          color: var(--text-secondary);
          margin: 0;
          font-size: 0.875rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .current-time {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .refresh-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: var(--primary-500);
          color: white;
          border-color: var(--primary-500);
        }

        .refresh-btn.spinning svg {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .action-btn:hover {
          border-color: var(--primary-400);
          color: var(--primary-400);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
        }

        .action-btn.primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        /* Stats Row */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          transition: all 0.2s;
        }

        .stat-card:hover {
          border-color: var(--primary-400);
        }

        .stat-card .stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(249, 115, 22, 0.1);
          color: var(--primary-400);
        }

        .stat-card.sales .stat-icon { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .stat-card.warning .stat-icon { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .stat-card.warning { cursor: pointer; }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .trend-icon {
          position: absolute;
          top: 16px;
          right: 16px;
        }

        .trend-icon.up { color: #22c55e; }
        .trend-icon.down { color: #ef4444; }

        /* Dashboard Grid */
        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Cards */
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 20px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-header h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }

        .card-header.warning h3 {
          color: #f59e0b;
        }

        .link-btn {
          background: none;
          border: none;
          color: var(--primary-400);
          font-size: 0.8rem;
          cursor: pointer;
        }

        .count-badge {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Bills List */
        .bills-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .bill-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--bg-tertiary);
          border-radius: 10px;
        }

        .bill-info {
          display: flex;
          flex-direction: column;
        }

        .bill-number {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .bill-customer {
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .bill-amount {
          text-align: right;
        }

        .bill-amount .amount {
          display: block;
          font-weight: 600;
        }

        .payment-badge {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          background: var(--bg-tertiary);
        }

        .payment-badge.cash { background: #22c55e20; color: #22c55e; }
        .payment-badge.upi { background: #3b82f620; color: #3b82f6; }
        .payment-badge.card { background: #f59e0b20; color: #f59e0b; }

        /* Stock List */
        .stock-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stock-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border-radius: 8px;
        }

        .product-name {
          font-size: 0.875rem;
        }

        .stock-level {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .stock-level.low { color: #f59e0b; }
        .stock-level.out { color: #ef4444; }

        .see-more {
          background: none;
          border: none;
          color: var(--primary-400);
          font-size: 0.8rem;
          cursor: pointer;
          padding: 8px;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 32px;
          color: var(--text-tertiary);
        }

        .empty-state svg {
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .empty-state p {
          margin-bottom: 16px;
        }

        .btn-primary {
          background: var(--primary-500);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
        }

        /* AI Section */
        .ai-section {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--border-subtle);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 1.25rem;
          margin: 0;
        }

        .pro-badge {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        /* Staff Notice */
        .staff-notice {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05));
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          margin-top: 24px;
        }

        .staff-notice p {
          margin: 0;
          color: var(--text-secondary);
        }

        /* Mobile */
        @media (max-width: 640px) {
          .welcome-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .stats-row {
            grid-template-columns: 1fr 1fr;
          }

          .stat-card {
            padding: 14px;
          }

          .stat-value {
            font-size: 1.25rem;
          }

          .quick-actions {
            gap: 8px;
          }

          .action-btn {
            padding: 10px 14px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  )
}
