import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Users, AlertTriangle, IndianRupee, ArrowUpRight, Clock, Zap, FileText, Package, Plus, Camera, BarChart3, RefreshCw, WifiOff } from 'lucide-react'
import realDataService from '../services/realDataService'
import WhatsAppAgentPanel from '../components/WhatsAppAgentPanel'
import api from '../services/api'

export default function Dashboard({ addToast, setCurrentPage }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayBills: 0,
    avgBillValue: 0,
    lowStockCount: 0
  })
  const [products, setProducts] = useState([])
  const [bills, setBills] = useState([])
  const [activity, setActivity] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setDataError(null)

    try {
      // Fetch all data from real backend APIs
      const [statsData, productsData, billsData, activityData] = await Promise.all([
        realDataService.getDashboardStats(),
        realDataService.getProducts(),
        realDataService.getBills({ limit: 10 }),
        realDataService.getDashboardActivity()
      ])

      setStats({
        todaySales: statsData.todaySales || 0,
        todayBills: statsData.todayBills || billsData.length || 0,
        avgBillValue: statsData.avgBillValue || 0,
        lowStockCount: statsData.lowStockCount || productsData.filter(p => p.stock <= p.minStock).length || 0
      })

      setProducts(productsData)
      setBills(billsData)
      setActivity(activityData)

      // Calculate hourly data from bills if not provided
      if (billsData.length > 0) {
        const hourlyMap = {}
        billsData.forEach(bill => {
          const hour = new Date(bill.createdAt).getHours()
          hourlyMap[hour] = (hourlyMap[hour] || 0) + bill.total
        })
        const hourlyArr = Object.entries(hourlyMap).map(([hour, sales]) => ({
          hour: `${hour}:00`,
          sales
        }))
        setHourlyData(hourlyArr)
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setDataError('Failed to load data. Please check your connection.')
      addToast?.('Failed to load dashboard data', 'error')
    } finally {
      setIsLoading(false)
    }
  }


  const formatCurrency = (n) => `₹${n.toLocaleString('en-IN')}`
  const formatTime = (date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (date) => date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const lowStockProducts = products.filter(p => p.stock <= p.minStock)
  const maxSales = Math.max(...(hourlyData.map(h => h.sales) || [0]), 1)

  const refresh = () => {
    setIsRefreshing(true)
    loadDashboardData().finally(() => {
      setIsRefreshing(false)
      addToast('Dashboard refreshed', 'success')
    })
  }

  const quickActions = [
    { label: 'New Bill', icon: Plus, page: 'create-bill', color: 'primary' },
    { label: 'Scan Bill', icon: Camera, page: 'ocr', color: 'secondary' },
    { label: 'View Bills', icon: FileText, page: 'bills', color: 'secondary' },
    { label: 'Analytics', icon: BarChart3, page: 'analytics', color: 'secondary' },
  ]

  return (
    <div className="dashboard">
      {/* Header with Time */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">🏪 Dashboard</h1>
          <p className="page-subtitle">{formatDate(currentTime)}</p>
        </div>
        <div className="header-right">
          <div className="live-time">
            <Clock size={18} />
            <span>{formatTime(currentTime)}</span>
          </div>
          <button className={`btn btn-ghost ${isRefreshing ? 'spin' : ''}`} onClick={refresh}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-grid">
        {quickActions.map((action, i) => (
          <button
            key={i}
            className={`quick-action-btn ${action.color}`}
            onClick={() => setCurrentPage(action.page)}
          >
            <action.icon size={24} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-icon"><IndianRupee size={28} /></div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats.todaySales)}</span>
            <span className="stat-label">Today's Sales</span>
          </div>
          <div className="stat-change positive">
            <ArrowUpRight size={16} />
            +18.5%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShoppingBag size={28} /></div>
          <div className="stat-content">
            <span className="stat-value">{stats.todayBills}</span>
            <span className="stat-label">Total Bills</span>
          </div>
          <div className="stat-change positive">
            <ArrowUpRight size={16} />
            +12%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={28} /></div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats.avgBillValue)}</span>
            <span className="stat-label">Avg Bill Value</span>
          </div>
          <div className="stat-change positive">
            <ArrowUpRight size={16} />
            +5.2%
          </div>
        </div>
        <div className={`stat-card ${stats.lowStockCount > 0 ? 'warning' : ''}`}>
          <div className="stat-icon"><Package size={28} /></div>
          <div className="stat-content">
            <span className="stat-value">{stats.lowStockCount}</span>
            <span className="stat-label">Low Stock Items</span>
          </div>
          {stats.lowStockCount > 0 && (
            <button className="btn btn-sm btn-warning" onClick={() => setCurrentPage('products')}>Fix</button>
          )}
        </div>
      </div>

      {/* WhatsApp AI Agent Panel */}
      <WhatsAppAgentPanel addToast={addToast} />

      <div className="dashboard-grid">
        {/* Sales Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3 className="card-title"><BarChart3 size={20} /> Today's Sales Trend</h3>
          </div>
          <div className="chart-container">
            <div className="area-chart">
              <div className="chart-bars">
                {hourlyData.map((data, i) => (
                  <div key={i} className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{ height: `${(data.sales / maxSales) * 100}%` }}
                      title={`${data.hour}: ₹${data.sales}`}
                    >
                      <span className="bar-tooltip">₹{data.sales}</span>
                    </div>
                    <span className="bar-label">{data.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-summary">
            <div className="summary-item">
              <span className="label">Peak Hour</span>
              <span className="value">11 AM - ₹6,800</span>
            </div>
            <div className="summary-item">
              <span className="label">Total Customers</span>
              <span className="value">{hourlyData.reduce((s, h) => s + h.customers, 0)}</span>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Zap size={20} /> Live Activity</h3>
          </div>
          <div className="activity-feed">
            {demoActivity.map(item => (
              <div key={item.id} className={`activity-item ${item.type}`}>
                <div className="activity-dot"></div>
                <div className="activity-content">
                  <p>{item.message}</p>
                  <span className="activity-time">{item.time}</span>
                </div>
                {item.amount && <span className="activity-amount">₹{item.amount}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><AlertTriangle size={20} /> Low Stock Alerts</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('products')}>View All</button>
          </div>
          <div className="low-stock-list">
            {lowStockProducts.slice(0, 5).map(product => (
              <div key={product.id} className="low-stock-item">
                <div className="product-info">
                  <span className="product-name">{product.name}</span>
                  <span className="product-category">{product.category}</span>
                </div>
                <div className="stock-info">
                  <span className={`stock-level ${product.stock === 0 ? 'out' : 'low'}`}>
                    {product.stock} / {product.minStock} {product.unit}
                  </span>
                  <div className="stock-bar">
                    <div
                      className="stock-fill"
                      style={{ width: `${Math.min(100, (product.stock / product.minStock) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bills */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileText size={20} /> Recent Bills</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setCurrentPage('bills')}>View All</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {demoBills.slice(0, 5).map(bill => (
                  <tr key={bill.id}>
                    <td><code>{bill.bill_number}</code></td>
                    <td>{bill.customer_name}</td>
                    <td className="amount">₹{bill.total.toFixed(2)}</td>
                    <td><span className={`badge badge-${bill.payment_mode === 'UPI' ? 'info' : bill.payment_mode === 'Card' ? 'warning' : 'success'}`}>{bill.payment_mode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Insights Banner */}
      <div className="ai-insights-banner">
        <div className="ai-icon"><Zap size={24} /></div>
        <div className="ai-content">
          <h4>AI Insight</h4>
          <p>Your peak sales hour is 11 AM - 12 PM. Consider having extra staff during this time for faster billing.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCurrentPage('analytics')}>View More Insights</button>
      </div>

      <style>{`
        /* Dashboard Header */
        .dashboard-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        
        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            margin-bottom: 16px;
          }
          .header-right {
            width: 100%;
            justify-content: space-between;
          }
        }
        
        .header-right { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }
        
        .live-time { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          padding: 8px 16px; 
          background: var(--bg-card); 
          border: 1px solid var(--border-subtle); 
          border-radius: var(--radius-lg); 
          font-weight: 600; 
          font-size: 1.125rem; 
        }
        
        @media (max-width: 480px) {
          .live-time {
            padding: 6px 12px;
            font-size: 1rem;
          }
        }
        
        .spin svg { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Quick Actions Grid */
        .quick-actions-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 12px; 
          margin-bottom: 24px; 
        }
        
        @media (max-width: 900px) { 
          .quick-actions-grid { 
            grid-template-columns: repeat(2, 1fr); 
          } 
        }
        
        @media (max-width: 480px) { 
          .quick-actions-grid { 
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          } 
        }
        
        .quick-action-btn {
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center;
          gap: 8px; 
          padding: 20px; 
          background: var(--bg-card);
          border: 2px solid var(--border-subtle); 
          border-radius: var(--radius-xl);
          cursor: pointer; 
          transition: all var(--transition-fast);
          font-weight: 600; 
          color: var(--text-secondary);
          -webkit-tap-highlight-color: transparent;
          min-height: 100px;
        }
        
        @media (max-width: 480px) {
          .quick-action-btn {
            padding: 16px 12px;
            min-height: 80px;
            font-size: 0.875rem;
          }
          .quick-action-btn svg {
            width: 20px;
            height: 20px;
          }
        }
        
        .quick-action-btn:hover { 
          border-color: var(--primary-400); 
          color: var(--primary-400); 
        }
        
        @media (hover: hover) and (pointer: fine) {
          .quick-action-btn:hover {
            transform: translateY(-2px);
          }
        }
        
        .quick-action-btn:active {
          transform: scale(0.98);
        }
        
        .quick-action-btn.primary { 
          background: var(--gradient-primary); 
          color: white; 
          border: none; 
        }
        
        .quick-action-btn.primary:hover { 
          opacity: 0.9; 
        }

        /* Stats Grid */
        .stats-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 16px; 
          margin-bottom: 24px; 
        }
        
        @media (max-width: 1024px) { 
          .stats-grid { 
            grid-template-columns: repeat(2, 1fr); 
          } 
        }
        
        @media (max-width: 480px) { 
          .stats-grid { 
            grid-template-columns: 1fr;
            gap: 12px;
            margin-bottom: 16px;
          } 
        }
        
        .stat-card {
          display: flex; 
          align-items: center; 
          gap: 16px;
          padding: 20px; 
          background: var(--bg-card);
          border: 1px solid var(--border-subtle); 
          border-radius: var(--radius-xl);
          position: relative; 
          overflow: hidden;
        }
        
        @media (max-width: 480px) {
          .stat-card {
            padding: 16px;
            gap: 12px;
          }
        }
        
        .stat-card.highlight { 
          background: var(--gradient-primary); 
          color: white; 
          border: none; 
        }
        
        .stat-card.highlight .stat-icon { 
          background: rgba(255,255,255,0.2); 
        }
        
        .stat-card.warning { 
          border-color: var(--warning); 
        }
        
        .stat-icon { 
          width: 56px; 
          height: 56px; 
          background: var(--bg-tertiary); 
          border-radius: var(--radius-lg); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: var(--primary-400);
          flex-shrink: 0;
        }
        
        @media (max-width: 480px) {
          .stat-icon {
            width: 48px;
            height: 48px;
          }
          .stat-icon svg {
            width: 24px;
            height: 24px;
          }
        }
        
        .stat-card.highlight .stat-icon { 
          color: white; 
        }
        
        .stat-content { 
          flex: 1;
          min-width: 0; /* Prevent overflow */
        }
        
        .stat-value { 
          font-size: 1.75rem; 
          font-weight: 800; 
          display: block;
          -webkit-font-smoothing: antialiased;
        }
        
        @media (max-width: 480px) {
          .stat-value {
            font-size: 1.5rem;
          }
        }
        
        .stat-label { 
          font-size: 0.875rem; 
          opacity: 0.8; 
        }
        
        .stat-change { 
          display: flex; 
          align-items: center; 
          gap: 4px; 
          font-size: 0.8125rem; 
          font-weight: 600; 
          position: absolute; 
          top: 16px; 
          right: 16px; 
        }
        
        @media (max-width: 480px) {
          .stat-change {
            top: 12px;
            right: 12px;
            font-size: 0.75rem;
          }
        }
        
        .stat-change.positive { 
          color: var(--success); 
        }
        
        .stat-card.highlight .stat-change { 
          color: rgba(255,255,255,0.9); 
        }

        /* Dashboard Grid */
        .dashboard-grid { 
          display: grid; 
          grid-template-columns: 1.5fr 1fr; 
          gap: 24px; 
          margin-bottom: 24px; 
        }
        
        @media (max-width: 1024px) { 
          .dashboard-grid { 
            grid-template-columns: 1fr; 
          } 
        }
        
        @media (max-width: 480px) {
          .dashboard-grid {
            gap: 16px;
            margin-bottom: 16px;
          }
        }

        /* Chart Styles */
        .chart-card .chart-container { 
          padding: 20px 0; 
        }
        
        .area-chart { 
          height: 200px; 
        }
        
        @media (max-width: 480px) {
          .area-chart {
            height: 150px;
          }
        }
        
        .chart-bars { 
          display: flex; 
          align-items: flex-end; 
          justify-content: space-between; 
          height: 100%; 
          gap: 4px; 
          padding: 0 10px; 
        }
        
        .chart-bar-wrapper { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          flex: 1; 
          height: 100%; 
        }
        
        .chart-bar { 
          width: 100%; 
          max-width: 40px; 
          background: var(--gradient-primary); 
          border-radius: 4px 4px 0 0;
          position: relative; 
          transition: height 0.5s ease;
          cursor: pointer;
        }
        
        @media (max-width: 480px) {
          .chart-bar {
            max-width: 24px;
          }
        }
        
        .chart-bar:hover { 
          opacity: 0.8; 
        }
        
        .bar-tooltip { 
          position: absolute; 
          bottom: 100%; 
          left: 50%; 
          transform: translateX(-50%);
          padding: 4px 8px; 
          background: var(--bg-primary); 
          border-radius: var(--radius-sm);
          font-size: 0.6875rem; 
          white-space: nowrap; 
          opacity: 0;
          transition: opacity var(--transition-fast); 
          margin-bottom: 4px;
        }
        
        .chart-bar:hover .bar-tooltip { 
          opacity: 1; 
        }
        
        .bar-label { 
          font-size: 0.625rem; 
          color: var(--text-tertiary); 
          margin-top: 8px; 
        }
        
        .chart-summary { 
          display: flex; 
          gap: 24px; 
          padding-top: 16px; 
          border-top: 1px solid var(--border-subtle);
          flex-wrap: wrap;
        }
        
        @media (max-width: 480px) {
          .chart-summary {
            gap: 16px;
          }
        }
        
        .summary-item .label { 
          font-size: 0.75rem; 
          color: var(--text-tertiary); 
          display: block; 
        }
        
        .summary-item .value { 
          font-weight: 600; 
        }

        /* Activity Feed */
        .activity-feed { 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
          max-height: 300px; 
          overflow-y: auto;
          -webkit-overflow-scrolling: touch; /* iOS smooth scroll */
        }
        
        .activity-item { 
          display: flex; 
          align-items: flex-start; 
          gap: 12px; 
          padding: 12px; 
          background: var(--bg-tertiary); 
          border-radius: var(--radius-md); 
        }
        
        .activity-dot { 
          width: 8px; 
          height: 8px; 
          border-radius: 50%; 
          margin-top: 6px; 
          flex-shrink: 0; 
        }
        
        .activity-item.sale .activity-dot { background: var(--success); }
        .activity-item.stock .activity-dot { background: var(--warning); }
        .activity-item.payment .activity-dot { background: var(--primary-400); }
        .activity-item.ocr .activity-dot { background: #8b5cf6; }
        .activity-item.customer .activity-dot { background: #3b82f6; }
        
        .activity-content { 
          flex: 1;
          min-width: 0;
        }
        
        .activity-content p { 
          margin: 0 0 4px; 
          font-size: 0.875rem; 
        }
        
        .activity-time { 
          font-size: 0.75rem; 
          color: var(--text-tertiary); 
        }
        
        .activity-amount { 
          font-weight: 700; 
          color: var(--success); 
        }

        /* Low Stock List */
        .low-stock-list { 
          display: flex; 
          flex-direction: column; 
          gap: 12px; 
        }
        
        .low-stock-item { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 12px; 
          background: var(--bg-tertiary); 
          border-radius: var(--radius-md); 
        }
        
        .product-name { 
          font-weight: 500; 
          display: block; 
        }
        
        .product-category { 
          font-size: 0.75rem; 
          color: var(--text-tertiary); 
        }
        
        .stock-info { 
          text-align: right; 
          min-width: 100px;
          flex-shrink: 0;
        }
        
        @media (max-width: 480px) {
          .stock-info {
            min-width: 80px;
          }
        }
        
        .stock-level { 
          font-size: 0.8125rem; 
          display: block; 
          margin-bottom: 4px; 
        }
        
        .stock-level.low { color: var(--warning); }
        .stock-level.out { color: var(--error); }
        
        .stock-bar { 
          height: 4px; 
          background: var(--bg-secondary); 
          border-radius: 2px; 
          overflow: hidden; 
        }
        
        .stock-fill { 
          height: 100%; 
          background: var(--warning); 
          border-radius: 2px; 
        }

        /* Table Amount */
        .amount { 
          font-weight: 600; 
          color: var(--primary-400); 
        }

        /* AI Insights Banner */
        .ai-insights-banner {
          display: flex; 
          align-items: center; 
          gap: 20px;
          padding: 24px; 
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%);
          border: 1px solid var(--primary-400); 
          border-radius: var(--radius-xl);
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .ai-insights-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 20px;
            gap: 16px;
          }
          .ai-insights-banner .btn {
            width: 100%;
            justify-content: center;
          }
        }
        
        .ai-icon { 
          width: 56px; 
          height: 56px; 
          background: var(--gradient-primary); 
          border-radius: var(--radius-lg); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          color: white;
          flex-shrink: 0;
        }
        
        .ai-content { 
          flex: 1;
          min-width: 0;
        }
        
        .ai-content h4 { 
          margin: 0 0 4px; 
          color: var(--primary-400); 
        }
        
        .ai-content p { 
          margin: 0; 
          color: var(--text-secondary); 
        }
        
        /* Table responsive */
        @media (max-width: 640px) {
          .table-container {
            margin: 0 -16px;
            border-radius: 0;
          }
          
          table {
            font-size: 0.8125rem;
          }
          
          th, td {
            padding: 10px 8px;
          }
          
          th:first-child, td:first-child {
            padding-left: 16px;
          }
          
          th:last-child, td:last-child {
            padding-right: 16px;
          }
        }
      `}</style>
    </div>
  )
}
