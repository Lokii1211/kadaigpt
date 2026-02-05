import { useState, useEffect } from 'react'
import { ShoppingCart, Home, FileText, Package, BarChart3, Users, Settings as SettingsIcon, Plus, Command, LogOut, Menu, X, Bell, User, ChevronDown } from 'lucide-react'
import MobileNav from './components/MobileNav'
import OnboardingWizard from './components/OnboardingWizard'
import CommandPalette from './components/CommandPalette'
import UnifiedAIAssistant from './components/UnifiedAIAssistant'
import VoiceCommandAgent from './components/VoiceCommandAgent'
import Dashboard from './pages/Dashboard'
import Bills from './pages/Bills'
import OCRCapture from './pages/OCRCapture'
import Products from './pages/Products'
import CreateBill from './pages/CreateBill'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Customers from './pages/Customers'
import GSTReports from './pages/GSTReports'
import WhatsAppIntegration from './pages/WhatsAppIntegration'
import Suppliers from './pages/Suppliers'
import LoyaltyRewards from './pages/LoyaltyRewards'
import AIInsights from './pages/AIInsights'
import ExpenseTracker from './pages/ExpenseTracker'
import DailySummary from './pages/DailySummary'
import BulkOperations from './pages/BulkOperations'
import AdminPanel from './pages/AdminPanel'
import Subscription from './pages/Subscription'
import StaffManagement from './pages/StaffManagement'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import api from './services/api'
import { demoProducts } from './services/demoData'
import './App.css'
import './styles/mobile.css'
import './styles/enhancements.css'

function App() {
    const getInitialPage = () => {
        const hash = window.location.hash.replace('#', '')
        const validPages = ['dashboard', 'bills', 'create-bill', 'ocr', 'products', 'analytics', 'customers', 'gst', 'whatsapp', 'suppliers', 'loyalty', 'ai-insights', 'expenses', 'daily-summary', 'bulk-operations', 'admin', 'settings', 'admin-login']
        return validPages.includes(hash) ? hash : 'dashboard'
    }

    const [currentPage, setCurrentPageState] = useState(getInitialPage)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [toasts, setToasts] = useState([])
    const [user, setUser] = useState(null)
    const [userRole, setUserRole] = useState(localStorage.getItem('kadai_user_role') || 'owner')
    const [loading, setLoading] = useState(true)
    const [products] = useState(demoProducts)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [showCommandPalette, setShowCommandPalette] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([
        { id: 1, type: 'warning', message: 'Sugar stock is low (3 left)', time: '5 min ago', read: false },
        { id: 2, type: 'info', message: 'New bill #1234 created', time: '10 min ago', read: false },
        { id: 3, type: 'success', message: 'Daily backup completed', time: '1 hour ago', read: true },
    ])

    const setCurrentPage = (page) => {
        setCurrentPageState(page)
        window.location.hash = page
        setMobileMenuOpen(false)
    }

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '')
            if (hash && hash !== currentPage) {
                setCurrentPageState(hash)
            }
        }
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [currentPage])

    useEffect(() => {
        const checkAuth = async () => {
            const token = api.getToken()
            if (token) {
                try {
                    const userData = await api.getProfile()
                    setUser(userData)
                } catch {
                    api.logout()
                }
            }
            setLoading(false)

            if (!localStorage.getItem('kadai_onboarding_complete') && !localStorage.getItem('kadai_demo_mode')) {
                setShowOnboarding(true)
            }
        }
        checkAuth()

        const handleKeyboard = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setShowCommandPalette(prev => !prev)
                return
            }
            if (e.key === 'Escape') setShowCommandPalette(false)
        }
        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [])

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            addToast('Back online! Syncing data...', 'success')
        }
        const handleOffline = () => {
            setIsOnline(false)
            addToast('You are offline. Data will sync when connected.', 'warning')
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const addToast = (message, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }

    const handleLogin = (userData) => {
        if (!userData.isDemo) {
            localStorage.removeItem('kadai_demo_mode')
        }
        setUser(userData)
        addToast(`Welcome, ${userData.username || userData.full_name || 'User'}!`, 'success')
    }

    const handleLogout = () => {
        api.logout()
        localStorage.removeItem('kadai_demo_mode')
        setUser(null)
        setCurrentPage('dashboard')
        addToast('Logged out successfully', 'info')
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard': return <Dashboard addToast={addToast} setCurrentPage={setCurrentPage} />
            case 'bills': return <Bills addToast={addToast} setCurrentPage={setCurrentPage} />
            case 'create-bill': return <CreateBill addToast={addToast} setCurrentPage={setCurrentPage} />
            case 'ocr': return <OCRCapture addToast={addToast} setCurrentPage={setCurrentPage} />
            case 'products': return <Products addToast={addToast} />
            case 'analytics': return <Analytics addToast={addToast} />
            case 'customers': return <Customers addToast={addToast} />
            case 'gst': return <GSTReports addToast={addToast} />
            case 'whatsapp': return <WhatsAppIntegration addToast={addToast} />
            case 'suppliers': return <Suppliers addToast={addToast} />
            case 'loyalty': return <LoyaltyRewards addToast={addToast} />
            case 'ai-insights': return <AIInsights addToast={addToast} />
            case 'expenses': return <ExpenseTracker addToast={addToast} />
            case 'daily-summary': return <DailySummary addToast={addToast} />
            case 'bulk-operations': return <BulkOperations addToast={addToast} />
            case 'admin': return <AdminPanel addToast={addToast} />
            case 'subscription': return <Subscription addToast={addToast} />
            case 'staff': return <StaffManagement addToast={addToast} />
            case 'settings': return <Settings addToast={addToast} />
            default: return <Dashboard addToast={addToast} setCurrentPage={setCurrentPage} />
        }
    }

    // Role-based navigation items
    const getNavItems = () => {
        const baseItems = [
            { id: 'dashboard', label: 'Dashboard', icon: Home },
            { id: 'create-bill', label: 'New Bill', icon: Plus, primary: true },
            { id: 'bills', label: 'Bills', icon: FileText },
            { id: 'products', label: 'Products', icon: Package },
        ]

        // Staff only sees basic items
        if (userRole === 'staff' || userRole === 'cashier') {
            return baseItems
        }

        // Owner/Manager sees more
        return [
            ...baseItems,
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        ]
    }

    const getMoreItems = () => {
        // Staff sees nothing in more menu
        if (userRole === 'staff' || userRole === 'cashier') {
            return []
        }

        const ownerItems = [
            { id: 'gst', label: 'GST Reports' },
            { id: 'suppliers', label: 'Suppliers' },
            { id: 'expenses', label: 'Expenses' },
            { id: 'daily-summary', label: 'Daily Report' },
        ]

        // Owner sees AI features
        if (userRole === 'owner' || userRole === 'admin') {
            return [
                ...ownerItems,
                { id: 'ai-insights', label: 'AI Insights' },
                { id: 'whatsapp', label: 'WhatsApp' },
                { id: 'loyalty', label: 'Loyalty' },
                { id: 'bulk-operations', label: 'Import/Export' },
            ]
        }

        return ownerItems
    }

    const navItems = getNavItems()
    const moreItems = getMoreItems()

    if (loading) {
        return (
            <div className="loading-screen" style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 60px rgba(249, 115, 22, 0.4)',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    <ShoppingCart size={40} color="white" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #fff 0%, #f97316 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px'
                    }}>KadaiGPT</h1>
                    <p style={{ color: '#666', fontSize: '0.9375rem' }}>AI-Powered Retail Intelligence</p>
                </div>
                <style>{`
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                `}</style>
            </div>
        )
    }

    if (!user) {
        return <Login onLogin={handleLogin} />
    }

    return (
        <div className="app-layout no-sidebar">
            {/* Onboarding Wizard */}
            {showOnboarding && (
                <OnboardingWizard
                    onComplete={() => {
                        setShowOnboarding(false)
                        addToast('Welcome aboard! 🚀 Your store is ready.', 'success')
                    }}
                />
            )}

            {/* Command Palette */}
            {showCommandPalette && (
                <CommandPalette
                    onClose={() => setShowCommandPalette(false)}
                    onNavigate={(page) => {
                        setCurrentPage(page)
                        setShowCommandPalette(false)
                    }}
                    addToast={addToast}
                />
            )}

            {/* TOP NAVBAR - Main Navigation */}
            <header className="top-navbar">
                <div className="navbar-left">
                    <div className="brand" onClick={() => setCurrentPage('dashboard')}>
                        <div className="brand-icon">
                            <ShoppingCart size={22} />
                        </div>
                        <span className="brand-name">KadaiGPT</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="nav-links desktop-only">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-link ${currentPage === item.id ? 'active' : ''} ${item.primary ? 'primary' : ''}`}
                                onClick={() => setCurrentPage(item.id)}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        ))}

                        {/* More Dropdown */}
                        <div className="nav-dropdown">
                            <button className="nav-link">
                                More <ChevronDown size={14} />
                            </button>
                            <div className="dropdown-menu">
                                {moreItems.map(item => (
                                    <button
                                        key={item.id}
                                        className="dropdown-item"
                                        onClick={() => setCurrentPage(item.id)}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>

                <div className="navbar-right">
                    {/* Online Status */}
                    <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    {/* Command Palette Trigger */}
                    <button className="icon-btn" onClick={() => setShowCommandPalette(true)} title="Quick Actions (Ctrl+K)">
                        <Command size={18} />
                    </button>

                    {/* Notifications */}
                    <div className="notification-wrapper">
                        <button
                            className={`icon-btn ${notifications.filter(n => !n.read).length > 0 ? 'has-notifications' : ''}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <Bell size={18} />
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <span>Notifications</span>
                                    <button onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}>
                                        Mark all read
                                    </button>
                                </div>
                                <div className="notification-list">
                                    {notifications.length > 0 ? notifications.map(n => (
                                        <div key={n.id} className={`notification-item ${n.type} ${n.read ? 'read' : ''}`}>
                                            <div className="notification-dot"></div>
                                            <div className="notification-content">
                                                <p>{n.message}</p>
                                                <span>{n.time}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="no-notifications">No notifications</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Menu */}
                    <div className="user-menu-wrapper">
                        <button className="user-btn" onClick={() => setShowUserMenu(!showUserMenu)}>
                            <div className="user-avatar">
                                <User size={16} />
                            </div>
                            <div className="user-info">
                                <span className="user-name">{user?.username || 'User'}</span>
                                <span className="user-role">{userRole}</span>
                            </div>
                            <ChevronDown size={14} />
                        </button>

                        {showUserMenu && (
                            <div className="user-dropdown">
                                <div className="dropdown-header">
                                    <span className="store-name">{localStorage.getItem('kadai_store_name') || 'My Store'}</span>
                                </div>
                                <button onClick={() => { setCurrentPage('settings'); setShowUserMenu(false); }}>
                                    <SettingsIcon size={16} /> Settings
                                </button>
                                {userRole === 'admin' && (
                                    <button onClick={() => { setCurrentPage('admin'); setShowUserMenu(false); }}>
                                        <User size={16} /> Admin Panel
                                    </button>
                                )}
                                <hr />
                                <button onClick={handleLogout} className="logout-btn">
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="mobile-menu-btn mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <nav className="mobile-menu" onClick={e => e.stopPropagation()}>
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
                                onClick={() => setCurrentPage(item.id)}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                        <hr />
                        {moreItems.map(item => (
                            <button
                                key={item.id}
                                className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
                                onClick={() => setCurrentPage(item.id)}
                            >
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="main-content no-sidebar">
                {renderPage()}
            </main>

            {/* AI Assistants */}
            <UnifiedAIAssistant addToast={addToast} setCurrentPage={setCurrentPage} products={products} />
            <VoiceCommandAgent addToast={addToast} setCurrentPage={setCurrentPage} />

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* Mobile Bottom Nav */}
            <MobileNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

            {/* Offline Banner */}
            {!isOnline && (
                <div className="offline-banner">
                    <span>📴 Offline Mode - Data will sync when connected</span>
                </div>
            )}
        </div>
    )
}

export default App
