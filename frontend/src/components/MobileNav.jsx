import { useState, useEffect } from 'react'
import { Home, ShoppingCart, Package, Users, MoreHorizontal, X, Menu } from 'lucide-react'
import './MobileNav.css'

const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'create-bill', icon: ShoppingCart, label: 'New Bill' },
    { id: 'products', icon: Package, label: 'Inventory' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'more', icon: MoreHorizontal, label: 'More' },
]

const moreItems = [
    { id: 'bills', label: 'All Bills' },
    { id: 'ocr', label: 'Scan Bill' },
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'gst', label: 'GST Reports' },
    { id: 'loyalty', label: 'Loyalty' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'settings', label: 'Settings' },
]

export default function MobileNav({ currentPage, setCurrentPage }) {
    const [showMore, setShowMore] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    if (!isMobile) return null

    const handleNavClick = (id) => {
        if (id === 'more') {
            setShowMore(!showMore)
        } else {
            setCurrentPage(id)
            setShowMore(false)
        }
    }

    return (
        <>
            {/* Bottom Navigation */}
            <nav className="mobile-nav">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = item.id === 'more'
                        ? moreItems.some(m => m.id === currentPage)
                        : currentPage === item.id

                    return (
                        <button
                            key={item.id}
                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.id)}
                        >
                            <Icon size={24} />
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </nav>

            {/* More Menu Overlay */}
            {showMore && (
                <div className="more-menu-overlay" onClick={() => setShowMore(false)}>
                    <div className="more-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="more-menu-header">
                            <h3>More Options</h3>
                            <button className="close-btn" onClick={() => setShowMore(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="more-menu-grid">
                            {moreItems.map((item) => (
                                <button
                                    key={item.id}
                                    className={`more-menu-item ${currentPage === item.id ? 'active' : ''}`}
                                    onClick={() => handleNavClick(item.id)}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
