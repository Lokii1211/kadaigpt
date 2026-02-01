import { useState, useEffect } from 'react'
import { ShoppingCart, Home, FileText, Camera, Package, Menu, X, BarChart3, Settings as SettingsIcon, Plus } from 'lucide-react'
import Sidebar from './components/Sidebar'
import VoiceAssistant from './components/VoiceAssistant'
import MobileNav from './components/MobileNav'
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
import Login from './pages/Login'
import api from './services/api'
import { demoProducts } from './services/demoData'
import './App.css'
import './styles/mobile.css'
import './styles/enhancements.css'


function App() {
    const [currentPage, setCurrentPage] = useState('dashboard')
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [toasts, setToasts] = useState([])
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [products] = useState(demoProducts)
    const [sidebarOpen, setSidebarOpen] = useState(false)

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
        }
        checkAuth()

        // Keyboard shortcuts
        const handleKeyboard = (e) => {
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
            case 'settings': return <Settings addToast={addToast} />
            default: return <Dashboard addToast={addToast} setCurrentPage={setCurrentPage} />
        }
    }

    if (loading) {
        return (
            <div className="loading-screen" style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px'
            }}>
                <div className="loader" style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid rgba(255,255,255,0.1)',
                    borderTopColor: '#f97316',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#888', fontSize: '1.125rem' }}>Loading KadaiGPT...</p>
            </div>
        )
    }

    if (!user) {
        return <Login onLogin={handleLogin} />
    }

    return (
        <div className="app-layout">
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

            {/* Keyboard Shortcut Hint - Hidden on mobile via CSS */}
            <div className="keyboard-hint">
                <span>F1 Dashboard</span>
                <span>F2 New Bill</span>
                <span>F3 Bills</span>
                <span>⌘S Scan</span>
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

