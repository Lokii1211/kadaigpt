import { useState } from 'react'
import { Bell, X, Check, AlertTriangle, Info, Package, TrendingDown, Users, Gift } from 'lucide-react'

const notificationIcons = {
    'low-stock': Package,
    'sales-drop': TrendingDown,
    'new-customer': Users,
    'reward': Gift,
    'alert': AlertTriangle,
    'info': Info
}

// Demo notifications for initial state
const demoNotifications = [
    {
        id: 1,
        type: 'low-stock',
        title: 'Low Stock Alert',
        message: 'Toor Dal is running low (8 kg remaining)',
        time: '5 min ago',
        read: false,
        priority: 'high'
    },
    {
        id: 2,
        type: 'reward',
        title: 'Loyalty Milestone',
        message: 'Priya Sharma earned 500 bonus points!',
        time: '1 hour ago',
        read: false,
        priority: 'medium'
    },
    {
        id: 3,
        type: 'new-customer',
        title: 'New Customer Registered',
        message: 'Amit Kumar signed up via WhatsApp',
        time: '2 hours ago',
        read: true,
        priority: 'low'
    },
    {
        id: 4,
        type: 'info',
        title: 'Daily Report Ready',
        message: 'Your daily summary for Jan 31 is ready',
        time: '3 hours ago',
        read: true,
        priority: 'low'
    }
]

export default function NotificationCenter({ notifications = demoNotifications }) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState(notifications)

    const unreadCount = items.filter(n => !n.read).length

    const markAsRead = (id) => {
        setItems(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ))
    }

    const markAllAsRead = () => {
        setItems(prev => prev.map(n => ({ ...n, read: true })))
    }

    const dismissNotification = (id) => {
        setItems(prev => prev.filter(n => n.id !== id))
    }

    return (
        <>
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="notification-panel">
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read"
                                    onClick={markAllAsRead}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="notification-list">
                            {items.length === 0 ? (
                                <div className="notification-empty">
                                    <Bell size={32} />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                items.map(notification => {
                                    const Icon = notificationIcons[notification.type] || Info
                                    return (
                                        <div
                                            key={notification.id}
                                            className={`notification-item ${notification.read ? 'read' : ''} priority-${notification.priority}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className={`notification-icon ${notification.type}`}>
                                                <Icon size={18} />
                                            </div>
                                            <div className="notification-content">
                                                <div className="notification-title">{notification.title}</div>
                                                <div className="notification-message">{notification.message}</div>
                                                <div className="notification-time">{notification.time}</div>
                                            </div>
                                            <button
                                                className="notification-dismiss"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    dismissNotification(notification.id)
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            <style>{`
                .notification-bell {
                    position: relative;
                    background: var(--bg-tertiary);
                    border: none;
                    border-radius: var(--radius-md);
                    padding: 10px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .notification-bell:hover {
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                }
                
                .notification-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    min-width: 18px;
                    height: 18px;
                    padding: 0 5px;
                    background: var(--error);
                    color: white;
                    font-size: 0.6875rem;
                    font-weight: 700;
                    border-radius: 9px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                }
                
                .notification-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 999;
                }
                
                .notification-panel {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 8px;
                    width: 360px;
                    max-height: 480px;
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-xl);
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    overflow: hidden;
                    animation: slideDown 0.2s ease-out;
                }
                @keyframes slideDown {
                    from { transform: translateY(-10px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .notification-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .notification-header h3 {
                    font-size: 1rem;
                    font-weight: 600;
                    margin: 0;
                }
                .mark-all-read {
                    background: none;
                    border: none;
                    color: var(--primary-400);
                    font-size: 0.8125rem;
                    cursor: pointer;
                }
                .mark-all-read:hover { text-decoration: underline; }
                
                .notification-list {
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .notification-empty {
                    padding: 48px;
                    text-align: center;
                    color: var(--text-tertiary);
                }
                .notification-empty svg {
                    margin-bottom: 12px;
                    opacity: 0.4;
                }
                
                .notification-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 14px 20px;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    border-left: 3px solid transparent;
                }
                .notification-item:hover {
                    background: var(--bg-tertiary);
                }
                .notification-item:not(.read) {
                    background: rgba(124, 58, 237, 0.05);
                }
                .notification-item.priority-high {
                    border-left-color: var(--error);
                }
                .notification-item.priority-medium {
                    border-left-color: var(--warning);
                }
                .notification-item.read {
                    opacity: 0.7;
                }
                
                .notification-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .notification-icon.low-stock {
                    background: rgba(239, 68, 68, 0.15);
                    color: var(--error);
                }
                .notification-icon.sales-drop {
                    background: rgba(234, 179, 8, 0.15);
                    color: var(--warning);
                }
                .notification-icon.new-customer {
                    background: rgba(34, 197, 94, 0.15);
                    color: var(--success);
                }
                .notification-icon.reward {
                    background: rgba(124, 58, 237, 0.15);
                    color: var(--primary-400);
                }
                .notification-icon.info {
                    background: rgba(59, 130, 246, 0.15);
                    color: var(--info);
                }
                
                .notification-content {
                    flex: 1;
                    min-width: 0;
                }
                .notification-title {
                    font-weight: 600;
                    font-size: 0.875rem;
                    margin-bottom: 2px;
                }
                .notification-message {
                    font-size: 0.8125rem;
                    color: var(--text-secondary);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .notification-time {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }
                
                .notification-dismiss {
                    background: none;
                    border: none;
                    color: var(--text-tertiary);
                    padding: 4px;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.15s;
                }
                .notification-item:hover .notification-dismiss {
                    opacity: 1;
                }
                .notification-dismiss:hover {
                    color: var(--error);
                }
            `}</style>
        </>
    )
}
