import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Users, AlertTriangle, IndianRupee, FileText, Package, Plus, RefreshCw, ArrowUpRight, UserPlus, Settings, Store, ChevronRight } from 'lucide-react'
import realDataService from '../services/realDataService'

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

  const userRole = localStorage.getItem('kadai_user_role') || 'owner'
  const storeName = localStorage.getItem('kadai_store_name') || 'My Store'
  const userPlan = localStorage.getItem('kadai_plan') || 'free'

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
        realDataService.getDashboardStats().catch(() => ({})),
        realDataService.getProducts().catch(() => []),
        realDataService.getBills({ limit: 5 }).catch(() => [])
      ])

      setStats({
        todaySales: statsData.todaySales || 0,
        todayBills: statsData.todayBills || billsData.length || 0,
        avgBillValue: statsData.avgBillValue || 0,
        lowStockCount: Array.isArray(productsData) ? productsData.filter(p => p.stock <= p.minStock).length : 0,
        totalCustomers: statsData.totalCustomers || 0,
        creditPending: statsData.creditPending || 0
      })

      setProducts(Array.isArray(productsData) ? productsData : [])
      setBills(Array.isArray(billsData) ? billsData : [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`
  const formatTime = () => currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const formatDate = () => currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })

  const lowStockProducts = products.filter(p => p.stock <= (p.minStock || 5))

  const refresh = () => {
    setIsRefreshing(true)
    loadDashboardData().finally(() => {
      setIsRefreshing(false)
      addToast('Dashboard refreshed', 'success')
    })
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="dash">
      {/* Header */}
      <header className="dash-header">
        <div>
          <h1>{getGreeting()}! 👋</h1>
          <p>{storeName} • {formatDate()}</p>
        </div>
        <div className="dash-time">
          <span>{formatTime()}</span>
          <button onClick={refresh} className={isRefreshing ? 'spinning' : ''}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Low Stock Alert Banner */}
      {lowStockProducts.length > 0 && (
        <div className="low-stock-alert">
          <div className="alert-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="alert-content">
            <strong>{lowStockProducts.length} products need restocking!</strong>
            <span>{lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}{lowStockProducts.length > 3 ? ` +${lowStockProducts.length - 3} more` : ''}</span>
          </div>
          <button className="alert-btn" onClick={() => setCurrentPage('products')}>
            View All →
          </button>
        </div>
      )}

      {/* Role-Specific Quick Access */}
      <section className="role-quick-access">
        {/* Cashier View - Focus on billing */}
        {(userRole === 'cashier' || userRole === 'staff') && (
          <div className="quick-access-panel cashier">
            <div className="panel-header">
              <span className="role-tag">👤 Cashier Mode</span>
              <span className="panel-hint">Quick billing tools</span>
            </div>
            <div className="quick-access-grid">
              <button className="qa-btn primary large" onClick={() => setCurrentPage('create-bill')}>
                <Plus size={28} />
                <span>New Bill</span>
                <small>Start billing</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('bills')}>
                <FileText size={22} />
                <span>Today's Bills</span>
                <small>{stats.todayBills} bills</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('products')}>
                <Package size={22} />
                <span>Products</span>
                <small>View prices</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('customers')}>
                <Users size={22} />
                <span>Customers</span>
                <small>Lookup</small>
              </button>
            </div>
          </div>
        )}

        {/* Manager View - Oversight + Staff */}
        {userRole === 'manager' && (
          <div className="quick-access-panel manager">
            <div className="panel-header">
              <span className="role-tag">🛡️ Manager Mode</span>
              <span className="panel-hint">Store oversight tools</span>
            </div>
            <div className="quick-access-grid">
              <button className="qa-btn primary" onClick={() => setCurrentPage('create-bill')}>
                <Plus size={24} />
                <span>New Bill</span>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('analytics')}>
                <TrendingUp size={22} />
                <span>Analytics</span>
                <small>Sales data</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('staff')}>
                <UserPlus size={22} />
                <span>Staff</span>
                <small>Manage team</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('products')}>
                <Package size={22} />
                <span>Inventory</span>
                <small>{stats.lowStockCount} low</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('bills')}>
                <FileText size={22} />
                <span>Bills</span>
                <small>Today: {stats.todayBills}</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('customers')}>
                <Users size={22} />
                <span>Customers</span>
              </button>
            </div>
          </div>
        )}

        {/* Owner View - Full control */}
        {(userRole === 'owner' || userRole === 'admin') && (
          <div className="quick-access-panel owner">
            <div className="panel-header">
              <span className="role-tag">👑 Owner Dashboard</span>
              <span className={`plan-badge ${userPlan}`}>{userPlan.toUpperCase()}</span>
            </div>
            <div className="quick-access-grid">
              <button className="qa-btn primary large" onClick={() => setCurrentPage('create-bill')}>
                <Plus size={28} />
                <span>New Bill</span>
                <small>Start billing</small>
              </button>
              <button className="qa-btn highlight" onClick={() => setCurrentPage('analytics')}>
                <TrendingUp size={22} />
                <span>Analytics</span>
                <small>Business insights</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('staff')}>
                <UserPlus size={22} />
                <span>Staff</span>
                <small>Team mgmt</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('stores')}>
                <Store size={22} />
                <span>Stores</span>
                <small>Multi-location</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('products')}>
                <Package size={22} />
                <span>Inventory</span>
                <small>{products.length} items</small>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('bills')}>
                <FileText size={22} />
                <span>Bills</span>
              </button>
              <button className="qa-btn" onClick={() => setCurrentPage('customers')}>
                <Users size={22} />
                <span>Customers</span>
              </button>
              {userPlan === 'free' && (
                <button className="qa-btn upgrade" onClick={() => setCurrentPage('subscription')}>
                  <ChevronRight size={22} />
                  <span>Upgrade</span>
                  <small>Unlock more</small>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="dash-stats">
        <div className="stat-card green">
          <IndianRupee size={20} />
          <div>
            <strong>{formatCurrency(stats.todaySales)}</strong>
            <span>Today's Sales</span>
          </div>
          <ArrowUpRight className="trend" size={16} />
        </div>
        <div className="stat-card blue">
          <ShoppingBag size={20} />
          <div>
            <strong>{stats.todayBills}</strong>
            <span>Bills Today</span>
          </div>
        </div>
        <div className="stat-card purple">
          <TrendingUp size={20} />
          <div>
            <strong>{formatCurrency(stats.avgBillValue)}</strong>
            <span>Avg Bill</span>
          </div>
        </div>
        {stats.lowStockCount > 0 && (
          <div className="stat-card red clickable" onClick={() => setCurrentPage('products')}>
            <AlertTriangle size={20} />
            <div>
              <strong>{stats.lowStockCount}</strong>
              <span>Low Stock</span>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid */}
      <section className="dash-grid">
        {/* Recent Bills */}
        <div className="dash-card">
          <div className="card-head">
            <h3><FileText size={16} /> Recent Bills</h3>
            <button onClick={() => setCurrentPage('bills')}>View All</button>
          </div>
          {bills.length > 0 ? (
            <div className="bills-list">
              {bills.slice(0, 5).map(bill => (
                <div key={bill.id} className="bill-row">
                  <div>
                    <strong>#{bill.bill_number || bill.id}</strong>
                    <span>{bill.customer_name || 'Walk-in'}</span>
                  </div>
                  <div className="bill-amt">
                    <strong>{formatCurrency(bill.total || bill.amount)}</strong>
                    <span className={`badge ${(bill.payment_mode || 'cash').toLowerCase()}`}>
                      {bill.payment_mode || 'Cash'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <FileText size={40} />
              <p>No bills yet</p>
              <button onClick={() => setCurrentPage('create-bill')}>Create First Bill</button>
            </div>
          )}
        </div>

        {/* Low Stock */}
        {lowStockProducts.length > 0 && (
          <div className="dash-card warning">
            <div className="card-head">
              <h3><AlertTriangle size={16} /> Low Stock</h3>
              <span className="count">{lowStockProducts.length}</span>
            </div>
            <div className="stock-list">
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="stock-row">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? 'out' : 'low'}>{p.stock} left</span>
                </div>
              ))}
              {lowStockProducts.length > 5 && (
                <button className="more" onClick={() => setCurrentPage('products')}>
                  +{lowStockProducts.length - 5} more items
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Manager Controls - Manager can manage staff */}
      {userRole === 'manager' && (
        <section className="owner-section">
          <h3>Manager Controls</h3>
          <div className="owner-btns">
            <button onClick={() => setCurrentPage('staff')}>
              <UserPlus size={20} />
              Manage Staff
            </button>
            <button onClick={() => setCurrentPage('analytics')}>
              <TrendingUp size={20} />
              Analytics
            </button>
          </div>
        </section>
      )}

      {/* Owner Quick Access */}
      {(userRole === 'owner' || userRole === 'admin') && (
        <section className="owner-section">
          <div className="section-header">
            <h3>Owner Controls</h3>
            <span className={`plan-badge ${userPlan}`}>{userPlan.toUpperCase()} Plan</span>
          </div>
          <div className="owner-btns">
            <button onClick={() => setCurrentPage('staff')}>
              <UserPlus size={20} />
              Manage Staff
            </button>
            <button onClick={() => setCurrentPage('stores')}>
              <Store size={20} />
              My Stores
            </button>
            <button onClick={() => setCurrentPage('analytics')}>
              <TrendingUp size={20} />
              Analytics
            </button>
            <button onClick={() => setCurrentPage('subscription')}>
              <Settings size={20} />
              {userPlan === 'free' ? 'Upgrade' : 'Subscription'}
            </button>
          </div>
        </section>
      )}

      <style>{`
        .dash { max-width: 1200px; margin: 0 auto; }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .dash-header h1 { font-size: 1.75rem; margin: 0 0 4px; }
        .dash-header p { color: var(--text-secondary); margin: 0; }
        .dash-time { display: flex; align-items: center; gap: 12px; }
        .dash-time span { font-size: 1.5rem; font-weight: 600; }
        .dash-time button {
          width: 36px; height: 36px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
        .dash-time button:hover { background: var(--primary-500); color: white; border-color: var(--primary-500); }
        .dash-time button.spinning svg { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Low Stock Alert Banner */
        .low-stock-alert {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.06));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 14px;
          margin-bottom: 20px;
        }
        .alert-icon {
          width: 40px;
          height: 40px;
          background: rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
        }
        .alert-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .alert-content strong { color: #ef4444; font-size: 0.95rem; }
        .alert-content span { color: var(--text-secondary); font-size: 0.8rem; }
        .alert-btn {
          padding: 10px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
        }
        .alert-btn:hover { background: #dc2626; }

        /* Role-Specific Quick Access */
        .role-quick-access {
          margin-bottom: 24px;
        }
        .quick-access-panel {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 20px;
        }
        .quick-access-panel.cashier {
          border-color: rgba(34, 197, 94, 0.3);
          background: linear-gradient(135deg, var(--bg-card), rgba(34, 197, 94, 0.05));
        }
        .quick-access-panel.manager {
          border-color: rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, var(--bg-card), rgba(59, 130, 246, 0.05));
        }
        .quick-access-panel.owner {
          border-color: rgba(251, 146, 60, 0.3);
          background: linear-gradient(135deg, var(--bg-card), rgba(251, 146, 60, 0.05));
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .role-tag {
          font-size: 0.9rem;
          font-weight: 700;
        }
        .panel-hint {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }
        .quick-access-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .qa-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 16px 12px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-primary);
        }
        .qa-btn:hover {
          border-color: var(--primary-400);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.12);
        }
        .qa-btn span { font-size: 0.85rem; font-weight: 600; }
        .qa-btn small { font-size: 0.7rem; color: var(--text-tertiary); }
        .qa-btn.primary {
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          border-color: var(--primary-500);
          color: white;
        }
        .qa-btn.primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(251, 146, 60, 0.3);
        }
        .qa-btn.primary small { color: rgba(255,255,255,0.8); }
        .qa-btn.large {
          grid-row: span 1;
          padding: 24px 16px;
        }
        .qa-btn.highlight {
          border-color: rgba(251, 146, 60, 0.4);
          background: rgba(251, 146, 60, 0.1);
        }
        .qa-btn.upgrade {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border-color: #8b5cf6;
          color: white;
        }
        .qa-btn.upgrade small { color: rgba(255,255,255,0.8); }

        .dash-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .dash-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          border-radius: 12px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dash-btn:hover { border-color: var(--primary-400); color: var(--primary-400); }
        .dash-btn.primary {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          border: none;
        }
        .dash-btn.primary:hover { opacity: 0.9; transform: translateY(-1px); }

        .dash-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
          gap: 14px;
          position: relative;
        }
        .stat-card svg:first-child {
          width: 44px; height: 44px;
          padding: 10px;
          border-radius: 12px;
        }
        .stat-card.green svg:first-child { background: #22c55e20; color: #22c55e; }
        .stat-card.blue svg:first-child { background: #3b82f620; color: #3b82f6; }
        .stat-card.purple svg:first-child { background: #8b5cf620; color: #8b5cf6; }
        .stat-card.red svg:first-child { background: #ef444420; color: #ef4444; }
        .stat-card div { display: flex; flex-direction: column; }
        .stat-card strong { font-size: 1.5rem; }
        .stat-card span { font-size: 0.8rem; color: var(--text-tertiary); }
        .stat-card .trend { position: absolute; top: 16px; right: 16px; color: #22c55e; }
        .stat-card.clickable { cursor: pointer; }
        .stat-card.clickable:hover { border-color: #ef4444; }

        .dash-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) { .dash-grid { grid-template-columns: 1fr; } }

        .dash-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 16px;
          padding: 20px;
        }
        .dash-card.warning { border-color: #f59e0b50; }
        .card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .card-head h3 { display: flex; align-items: center; gap: 8px; font-size: 1rem; margin: 0; }
        .card-head button { background: none; border: none; color: var(--primary-400); cursor: pointer; font-size: 0.8rem; }
        .card-head .count { background: #ef4444; color: white; padding: 2px 10px; border-radius: 10px; font-size: 0.8rem; }

        .bills-list { display: flex; flex-direction: column; gap: 10px; }
        .bill-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          background: var(--bg-tertiary);
          border-radius: 10px;
        }
        .bill-row > div { display: flex; flex-direction: column; }
        .bill-row strong { font-size: 0.9rem; }
        .bill-row span { font-size: 0.75rem; color: var(--text-tertiary); }
        .bill-amt { text-align: right; }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.65rem;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .badge.cash { background: #22c55e20; color: #22c55e; }
        .badge.upi { background: #3b82f620; color: #3b82f6; }
        .badge.card { background: #f59e0b20; color: #f59e0b; }

        .stock-list { display: flex; flex-direction: column; gap: 8px; }
        .stock-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border-radius: 8px;
          font-size: 0.875rem;
        }
        .stock-row .low { color: #f59e0b; font-weight: 600; }
        .stock-row .out { color: #ef4444; font-weight: 600; }
        .more { background: none; border: none; color: var(--primary-400); cursor: pointer; padding: 8px; }

        .empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
        }
        .empty svg { margin-bottom: 12px; opacity: 0.3; }
        .empty p { margin-bottom: 16px; }
        .empty button {
          background: var(--primary-500);
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 500;
        }

        .owner-section {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(234, 88, 12, 0.04));
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-radius: 16px;
          padding: 20px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .section-header h3 { margin: 0; font-size: 1rem; }
        .plan-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .plan-badge.free { background: #71717a; color: white; }
        .plan-badge.pro { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }
        .plan-badge.business { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
        .plan-badge.enterprise { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
        .owner-section h3 { margin: 0 0 16px; font-size: 1rem; }
        .owner-btns { display: flex; gap: 12px; flex-wrap: wrap; }
        .owner-btns button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.875rem;
        }
        .owner-btns button:hover { border-color: var(--primary-400); color: var(--primary-400); }

        @media (max-width: 640px) {
          .dash-header { flex-direction: column; gap: 12px; }
          .dash-time { width: 100%; justify-content: space-between; }
          .dash-stats { grid-template-columns: 1fr 1fr; }
          .stat-card { padding: 14px; }
          .stat-card strong { font-size: 1.2rem; }
          .dash-btn { padding: 10px 16px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  )
}
