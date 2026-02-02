import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Home, FileText, Camera, Package, Menu, X, BarChart3, Settings as SettingsIcon, Plus, Command, Search } from 'lucide-react'
import Sidebar from './components/Sidebar'
import VoiceAssistant from './components/VoiceAssistant'
import MobileNav from './components/MobileNav'
import OnboardingWizard from './components/OnboardingWizard'
import CommandPalette from './components/CommandPalette'
import GlobalFAB from './components/GlobalFAB'
import AIChatBot from './components/AIChatBot'
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
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import api from './services/api'
import { demoProducts } from './services/demoData'
import './App.css'
import './styles/mobile.css'
import './styles/enhancements.css'


function App() {
    // Get initial page from URL hash or default to dashboard
    const getInitialPage = () => {
        const hash = window.location.hash.replace('#', '')
        const validPages = ['dashboard', 'bills', 'create-bill', 'ocr', 'products', 'analytics', 'customers', 'gst', 'whatsapp', 'suppliers', 'loyalty', 'ai-insights', 'expenses', 'daily-summary', 'bulk-operations', 'admin', 'settings', 'admin-login']
        return validPages.includes(hash) ? hash : 'dashboard'
    }

    const [currentPage, setCurrentPageState] = useState(getInitialPage)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [toasts, setToasts] = useState([])
    const [user, setUser] = useState(null)
    const [userRole, setUserRole] = useState(localStorage.getItem('kadai_user_role') || 'owner') // admin, owner, staff
    const [loading, setLoading] = useState(true)
    const [products] = useState(demoProducts)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [showCommandPalette, setShowCommandPalette] = useState(false)

    // Custom setCurrentPage that also updates URL hash
    const setCurrentPage = (page) => {
        setCurrentPageState(page)
        window.location.hash = page
    }

    // Listen for hash changes (back/forward button)
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
        // Check for existing session
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

            // Check if onboarding is needed for real users
            if (!localStorage.getItem('kadai_onboarding_complete') && !localStorage.getItem('kadai_demo_mode')) {
                setShowOnboarding(true)
            }
        }
        checkAuth()

        // Keyboard shortcuts
        const handleKeyboard = (e) => {
            // Command palette (Cmd+K or Ctrl+K)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setShowCommandPalette(prev => !prev)
                return
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n': e.preventDefault(); setCurrentPage('create-bill'); break;
                    case 'b': e.preventDefault(); setCurrentPage('bills'); break;
                    case 'd': e.preventDefault(); setCurrentPage('dashboard'); break;
                    case 's': e.preventDefault(); setCurrentPage('ocr'); break;
                }
            }
            // F keys for quick access
            switch (e.key) {
                case 'F1': e.preventDefault(); setCurrentPage('dashboard'); break;
                case 'F2': e.preventDefault(); setCurrentPage('create-bill'); break;
                case 'F3': e.preventDefault(); setCurrentPage('bills'); break;
                case 'F4': e.preventDefault(); setCurrentPage('products'); break;
                case 'Escape': setShowCommandPalette(false); break;
            }
        }
        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [])

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true)
            addToast('Back online! Syncing data...', 'success')
            // Sync offline data when back online
            api.syncOfflineData?.()
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

    // Close sidebar when page changes on mobile
    useEffect(() => {
        setSidebarOpen(false)
    }, [currentPage])

    const addToast = (message, type = 'info') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 4000)
    }

    const handleLogin = (userData) => {
        // Clear demo mode if user is not demo
        if (!userData.isDemo) {
            localStorage.removeItem('kadai_demo_mode')
        }
        setUser(userData)
        addToast(`Welcome, ${userData.username || userData.full_name || 'User'}!`, 'success')
    }

    const handleLogout = () => {
        api.logout()
        // Clear demo mode flag
        localStorage.removeItem('kadai_demo_mode')
        setUser(null)
        setCurrentPage('dashboard')
        addToast('Logged out successfully', 'info')
    }

    const handleVoiceCommand = (command) => {
        if (command.action === 'add_item' && command.product) {
            addToast(`Added ${command.quantity} ${command.product.unit} of ${command.product.name}`, 'success')
            // In a full implementation, this would add to cart
        }
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
            case 'settings': return <Settings addToast={addToast} />
            default: return <Dashboard addToast={addToast} setCurrentPage={setCurrentPage} />
        }
    }

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
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 20px 60px rgba(124, 58, 237, 0.4)',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    <ShoppingCart size={40} color="white" />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #fff 0%, #a78bfa 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '8px'
                    }}>KadaiGPT</h1>
                    <p style={{ color: '#666', fontSize: '0.9375rem' }}>AI-Powered Retail Intelligence</p>
                </div>
                <div className="loader" style={{
                    width: '200px',
                    height: '4px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        height: '100%',
                        width: '40%',
                        background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                        borderRadius: '4px',
                        animation: 'loading-bar 1.5s ease-in-out infinite'
                    }}></div>
                </div>
                <style>{`
                    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                    @keyframes loading-bar { 0% { left: -40%; } 100% { left: 100%; } }
                `}</style>
            </div>
        )
    }

    if (!user) {
        return <Login onLogin={handleLogin} />
    }

    return (
        <div className="app-layout">
            {/* Onboarding Wizard for New Users */}
            {showOnboarding && (
                <OnboardingWizard
                    onComplete={() => {
                        setShowOnboarding(false)
                        addToast('Welcome aboard! 🚀 Your store is ready.', 'success')
                    }}
                />
            )}

            {/* Command Palette (Cmd+K) */}
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

            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-header-title">
                    <ShoppingCart size={24} />
                    <span>KadaiGPT</span>
                </div>
                <div className="mobile-header-actions">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle menu"
                    >
                        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </header>

            {/* Sidebar Backdrop */}
            <div
                className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar with open state */}
            <Sidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                isOnline={isOnline}
                user={user}
                onLogout={handleLogout}
                isOpen={sidebarOpen}
            />

            <main className="main-content">
                {renderPage()}
            </main>

            {/* Bottom Navigation - Mobile Only */}
            <nav className="bottom-nav">
                <div className="bottom-nav-items">
                    <button
                        className={`bottom-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('dashboard')}
                    >
                        <Home size={24} />
                        <span>Home</span>
                    </button>
                    <button
                        className={`bottom-nav-item ${currentPage === 'bills' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('bills')}
                    >
                        <FileText size={24} />
                        <span>Bills</span>
                    </button>
                    <button
                        className={`bottom-nav-item ${currentPage === 'ocr' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('ocr')}
                    >
                        <Camera size={24} />
                        <span>Scan</span>
                    </button>
                    <button
                        className={`bottom-nav-item ${currentPage === 'products' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('products')}
                    >
                        <Package size={24} />
                        <span>Products</span>
                    </button>
                    <button
                        className={`bottom-nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
                        onClick={() => setCurrentPage('analytics')}
                    >
                        <BarChart3 size={24} />
                        <span>Analytics</span>
                    </button>
                </div>
            </nav>

            {/* Floating Action Button - Create Bill */}
            <button
                className="fab"
                onClick={() => setCurrentPage('create-bill')}
                aria-label="Create new bill"
            >
                <Plus size={28} />
            </button>

            {/* Voice Assistant */}
            <VoiceAssistant
                onCommand={handleVoiceCommand}
                onNavigate={setCurrentPage}
                products={products}
                addToast={addToast}
            />

            {/* Global FAB for Quick Actions */}
            <GlobalFAB
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                addToast={addToast}
            />

            {/* AI ChatBot */}
            <AIChatBot
                addToast={addToast}
                setCurrentPage={setCurrentPage}
            />

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav currentPage={currentPage} setCurrentPage={setCurrentPage} />

            {/* Keyboard Shortcut Hint - Desktop only */}
            <div className="keyboard-hint" onClick={() => setShowCommandPalette(true)} style={{ cursor: 'pointer' }}>
                <span className="cmd-k-hint">
                    <Command size={14} />
                    <span>K</span>
                </span>
                <span>Quick Actions</span>
            </div>

            {/* Offline Indicator */}
            {!isOnline && (
                <div className="offline-banner">
                    <span>📴 Offline Mode - Data will sync when connected</span>
                </div>
            )}
        </div>
    )
}

export default App

