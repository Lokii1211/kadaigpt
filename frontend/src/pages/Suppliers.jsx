import { useState } from 'react'
import { Truck, Plus, Phone, MapPin, Package, Calendar, Clock, TrendingUp, X, Check, AlertTriangle, Search, Filter, Mail, Star, ShoppingCart, MessageCircle } from 'lucide-react'
import whatsappService from '../services/whatsapp'

// Demo suppliers
const demoSuppliers = [
    { id: 1, name: 'Metro Wholesale', contact: 'Ajay Kumar', phone: '9876543210', email: 'ajay@metro.com', address: 'Kuniyamuthur, Coimbatore', category: 'Grains', rating: 4.5, totalOrders: 45, pendingAmount: 12500, lastOrder: '2026-01-28' },
    { id: 2, name: 'Reliance Fresh B2B', contact: 'Suresh Menon', phone: '9876543211', email: 'suresh@reliance.com', address: 'RS Puram, Coimbatore', category: 'Dairy', rating: 4.8, totalOrders: 32, pendingAmount: 0, lastOrder: '2026-01-25' },
    { id: 3, name: 'Udaan India', contact: 'Priya Verma', phone: '9876543212', email: 'priya@udaan.in', address: 'Gandhipuram, Coimbatore', category: 'General', rating: 4.2, totalOrders: 28, pendingAmount: 8500, lastOrder: '2026-01-20' },
    { id: 4, name: 'JioMart Business', contact: 'Rahul Sharma', phone: '9876543213', email: 'rahul@jiomart.com', address: 'Saibaba Colony, Coimbatore', category: 'FMCG', rating: 4.6, totalOrders: 15, pendingAmount: 0, lastOrder: '2026-01-15' },
]

// Demo purchase orders
const demoPurchaseOrders = [
    { id: 1, orderNo: 'PO-2026-0023', supplier: 'Metro Wholesale', items: 5, amount: 15000, status: 'pending', date: '2026-01-30', expectedDelivery: '2026-02-01' },
    { id: 2, orderNo: 'PO-2026-0022', supplier: 'Udaan India', items: 8, amount: 8500, status: 'delivered', date: '2026-01-28' },
    { id: 3, orderNo: 'PO-2026-0021', supplier: 'Reliance Fresh B2B', items: 3, amount: 4200, status: 'delivered', date: '2026-01-25' },
    { id: 4, orderNo: 'PO-2026-0020', supplier: 'Metro Wholesale', items: 12, amount: 28000, status: 'delivered', date: '2026-01-20' },
]

// Low stock products for ordering
const lowStockProducts = [
    { id: 1, name: 'Toor Dal', stock: 8, minStock: 15, unit: 'kg', suggestedQty: 20 },
    { id: 2, name: 'Salt', stock: 5, minStock: 20, unit: 'kg', suggestedQty: 30 },
]

export default function Suppliers({ addToast }) {
    const [suppliers, setSuppliers] = useState(demoSuppliers)
    const [orders, setOrders] = useState(demoPurchaseOrders)
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showOrderModal, setShowOrderModal] = useState(false)
    const [showCallModal, setShowCallModal] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState(null)
    const [newSupplier, setNewSupplier] = useState({ name: '', contact: '', phone: '', email: '', address: '', category: 'General' })
    const [orderItems, setOrderItems] = useState([])

    const storeName = localStorage.getItem('vyapar_store_name') || 'VyaparAI Store'

    // Stats
    const totalPending = suppliers.reduce((sum, s) => sum + s.pendingAmount, 0)
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const totalSuppliers = suppliers.length

    // Filter
    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase()) ||
        s.contact.toLowerCase().includes(search.toLowerCase())
    )

    const handleAddSupplier = () => {
        if (!newSupplier.name || !newSupplier.phone) {
            addToast('Name and phone are required', 'error')
            return
        }

        const supplier = {
            id: Date.now(),
            ...newSupplier,
            rating: 4.0,
            totalOrders: 0,
            pendingAmount: 0,
            lastOrder: null
        }
        setSuppliers([supplier, ...suppliers])
        setNewSupplier({ name: '', contact: '', phone: '', email: '', address: '', category: 'General' })
        setShowAddModal(false)
        addToast('Supplier added successfully!', 'success')
    }

    const handleCall = (supplier) => {
        setSelectedSupplier(supplier)
        setShowCallModal(true)
    }

    const makePhoneCall = () => {
        if (selectedSupplier) {
            window.location.href = `tel:+91${selectedSupplier.phone}`
            addToast(`Calling ${selectedSupplier.contact}...`, 'info')
            setShowCallModal(false)
        }
    }

    const sendWhatsAppMessage = () => {
        if (selectedSupplier) {
            const message = `Hi ${selectedSupplier.contact}, this is from ${storeName}. I'd like to discuss a stock order.`
            whatsappService.openWhatsApp(selectedSupplier.phone, message)
            setShowCallModal(false)
        }
    }

    const sendEmail = () => {
        if (selectedSupplier?.email) {
            window.location.href = `mailto:${selectedSupplier.email}?subject=Stock Order Inquiry - ${storeName}`
            setShowCallModal(false)
        }
    }

    const createPurchaseOrder = () => {
        if (!selectedSupplier) return

        const order = {
            id: Date.now(),
            orderNo: `PO-2026-${String(orders.length + 24).padStart(4, '0')}`,
            supplier: selectedSupplier.name,
            items: orderItems.length || lowStockProducts.length,
            amount: orderItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0) || 15000,
            status: 'pending',
            date: new Date().toISOString().split('T')[0],
            expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
        setOrders([order, ...orders])

        // Send WhatsApp notification to supplier
        whatsappService.sendStockOrder(selectedSupplier, lowStockProducts, storeName)

        addToast(`Purchase order ${order.orderNo} created and sent via WhatsApp`, 'success')
        setShowOrderModal(false)
        setSelectedSupplier(null)
        setOrderItems([])
    }

    const renderStars = (rating) => {
        const fullStars = Math.floor(rating)
        const hasHalf = rating % 1 >= 0.5
        return (
            <div className="stars">
                {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < fullStars ? 'star filled' : i === fullStars && hasHalf ? 'star half' : 'star'}>★</span>
                ))}
                <span className="rating-value">{rating}</span>
            </div>
        )
    }

    const markDelivered = (orderId) => {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
        addToast('Order marked as delivered', 'success')
    }

    return (
        <div className="suppliers-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🚚 Supplier Management</h1>
                    <p className="page-subtitle">Manage vendors and purchase orders</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-secondary" onClick={() => setShowOrderModal(true)}>
                        <Package size={18} /> New Order
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Add Supplier
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="supplier-stats">
                <div className="stat-card">
                    <Truck size={24} />
                    <div>
                        <span className="value">{totalSuppliers}</span>
                        <span className="label">Total Suppliers</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Package size={24} />
                    <div>
                        <span className="value">{orders.length}</span>
                        <span className="label">Purchase Orders</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <Clock size={24} />
                    <div>
                        <span className="value">{pendingOrders}</span>
                        <span className="label">Pending Orders</span>
                    </div>
                </div>
                <div className="stat-card">
                    <TrendingUp size={24} />
                    <div>
                        <span className="value">₹{totalPending.toLocaleString()}</span>
                        <span className="label">Payables</span>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="low-stock-alert">
                    <AlertTriangle size={20} />
                    <span><strong>{lowStockProducts.length} products</strong> are running low on stock. Quick order?</span>
                    <button className="btn btn-sm btn-warning" onClick={() => setShowOrderModal(true)}>
                        <ShoppingCart size={14} /> Order Now
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="card search-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search suppliers by name, category, or contact..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Suppliers Grid */}
            <div className="suppliers-grid">
                {filteredSuppliers.map(supplier => (
                    <div key={supplier.id} className="supplier-card">
                        <div className="supplier-header">
                            <div className="supplier-avatar">{supplier.name.charAt(0)}</div>
                            <div className="supplier-info">
                                <h3>{supplier.name}</h3>
                                <span className="category-badge">{supplier.category}</span>
                            </div>
                        </div>

                        <div className="supplier-details">
                            <div className="detail-row">
                                <Phone size={14} />
                                <span>{supplier.contact} • {supplier.phone}</span>
                            </div>
                            <div className="detail-row">
                                <MapPin size={14} />
                                <span>{supplier.address}</span>
                            </div>
                            {supplier.email && (
                                <div className="detail-row">
                                    <Mail size={14} />
                                    <span>{supplier.email}</span>
                                </div>
                            )}
                        </div>

                        {renderStars(supplier.rating)}

                        <div className="supplier-meta">
                            <div className="meta-item">
                                <span className="meta-value">{supplier.totalOrders}</span>
                                <span className="meta-label">Orders</span>
                            </div>
                            <div className="meta-item">
                                <span className={`meta-value ${supplier.pendingAmount > 0 ? 'pending' : ''}`}>
                                    ₹{supplier.pendingAmount.toLocaleString()}
                                </span>
                                <span className="meta-label">Pending</span>
                            </div>
                            {supplier.lastOrder && (
                                <div className="meta-item">
                                    <span className="meta-value">{new Date(supplier.lastOrder).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                    <span className="meta-label">Last Order</span>
                                </div>
                            )}
                        </div>

                        <div className="supplier-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => { setSelectedSupplier(supplier); setShowOrderModal(true); }}>
                                <Package size={14} /> Order
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleCall(supplier)}>
                                <Phone size={14} /> Contact
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="card mt-xl">
                <div className="card-header">
                    <h3 className="card-title"><Package size={20} /> Recent Purchase Orders</h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Order No</th>
                                <th>Supplier</th>
                                <th>Items</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td><code>{order.orderNo}</code></td>
                                    <td>{order.supplier}</td>
                                    <td>{order.items} items</td>
                                    <td className="amount">₹{order.amount.toLocaleString()}</td>
                                    <td>{new Date(order.date).toLocaleDateString('en-IN')}</td>
                                    <td>
                                        <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'secondary'}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </td>
                                    <td>
                                        {order.status === 'pending' && (
                                            <button className="btn btn-ghost btn-sm" onClick={() => markDelivered(order.id)}>
                                                <Check size={14} /> Received
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Supplier Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Supplier</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Business Name *</label>
                                <input type="text" className="form-input" placeholder="e.g., Metro Wholesale"
                                    value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Contact Person</label>
                                    <input type="text" className="form-input" placeholder="Name"
                                        value={newSupplier.contact} onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone *</label>
                                    <input type="tel" className="form-input" placeholder="10-digit number"
                                        value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-input" placeholder="supplier@email.com"
                                    value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <input type="text" className="form-input" placeholder="City, Area"
                                    value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={newSupplier.category} onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}>
                                    <option value="General">General</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="FMCG">FMCG</option>
                                    <option value="Beverages">Beverages</option>
                                    <option value="Vegetables">Vegetables</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddSupplier}>
                                Add Supplier
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {showCallModal && selectedSupplier && (
                <div className="modal-overlay" onClick={() => setShowCallModal(false)}>
                    <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Contact {selectedSupplier.name}</h3>
                            <button className="modal-close" onClick={() => setShowCallModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="contact-info">
                                <p><strong>Contact:</strong> {selectedSupplier.contact}</p>
                                <p><strong>Phone:</strong> {selectedSupplier.phone}</p>
                                {selectedSupplier.email && <p><strong>Email:</strong> {selectedSupplier.email}</p>}
                            </div>
                            <div className="contact-actions">
                                <button className="btn btn-primary contact-btn" onClick={makePhoneCall}>
                                    <Phone size={20} /> Call
                                </button>
                                <button className="btn btn-success contact-btn" onClick={sendWhatsAppMessage}>
                                    <MessageCircle size={20} /> WhatsApp
                                </button>
                                {selectedSupplier.email && (
                                    <button className="btn btn-secondary contact-btn" onClick={sendEmail}>
                                        <Mail size={20} /> Email
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Order Modal */}
            {showOrderModal && (
                <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create Purchase Order</h3>
                            <button className="modal-close" onClick={() => setShowOrderModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <p className="modal-subtitle">Select a supplier to create order</p>

                            {/* Low stock items to order */}
                            {lowStockProducts.length > 0 && (
                                <div className="low-stock-items">
                                    <h4><AlertTriangle size={16} /> Low Stock Items</h4>
                                    {lowStockProducts.map(product => (
                                        <div key={product.id} className="low-stock-item">
                                            <span>{product.name}</span>
                                            <span className="stock-warning">{product.stock}/{product.minStock} {product.unit}</span>
                                            <span className="suggested">Suggested: {product.suggestedQty} {product.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="supplier-select-list">
                                {suppliers.map(supplier => (
                                    <div
                                        key={supplier.id}
                                        className={`supplier-select-item ${selectedSupplier?.id === supplier.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedSupplier(supplier)}
                                    >
                                        <div className="supplier-avatar small">{supplier.name.charAt(0)}</div>
                                        <div>
                                            <span className="name">{supplier.name}</span>
                                            <span className="category">{supplier.category} • {supplier.contact}</span>
                                        </div>
                                        {selectedSupplier?.id === supplier.id && <Check size={18} className="check-icon" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={createPurchaseOrder} disabled={!selectedSupplier}>
                                <MessageCircle size={16} /> Create & Send via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .header-actions { display: flex; gap: 12px; }
        
        .supplier-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        @media (max-width: 1024px) { .supplier-stats { grid-template-columns: repeat(2, 1fr); } }
        .stat-card {
          display: flex; align-items: center; gap: 16px;
          padding: 20px; background: var(--bg-card);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
        }
        .stat-card svg { color: var(--primary-400); }
        .stat-card.warning svg { color: var(--warning); }
        .stat-card .value { font-size: 1.5rem; font-weight: 700; display: block; }
        .stat-card .label { font-size: 0.8125rem; color: var(--text-tertiary); }

        .low-stock-alert {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; background: rgba(245, 158, 11, 0.1);
          border: 1px solid var(--warning); border-radius: var(--radius-lg);
          margin-bottom: 20px;
        }
        .low-stock-alert svg { color: var(--warning); }

        .suppliers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }

        .supplier-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl); padding: 20px;
          transition: all var(--transition-fast);
        }
        .supplier-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        .supplier-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .supplier-avatar { 
          width: 48px; height: 48px; background: var(--gradient-primary);
          border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 1.25rem;
        }
        .supplier-avatar.small { width: 36px; height: 36px; font-size: 1rem; }
        .supplier-info h3 { margin: 0 0 4px; font-size: 1rem; }
        .category-badge { font-size: 0.75rem; padding: 2px 8px; background: var(--bg-tertiary); border-radius: var(--radius-sm); color: var(--text-secondary); }

        .supplier-details { margin-bottom: 12px; }
        .detail-row { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 6px; }
        .detail-row svg { color: var(--text-tertiary); flex-shrink: 0; }

        .stars { display: flex; align-items: center; gap: 2px; margin-bottom: 16px; }
        .star { color: #d1d5db; font-size: 1rem; }
        .star.filled { color: #fbbf24; }
        .rating-value { margin-left: 8px; font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }

        .supplier-meta { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); }
        .meta-item { text-align: center; }
        .meta-value { font-size: 1.125rem; font-weight: 700; display: block; }
        .meta-value.pending { color: var(--warning); }
        .meta-label { font-size: 0.75rem; color: var(--text-tertiary); }

        .supplier-actions { display: flex; gap: 8px; }
        .supplier-actions .btn { flex: 1; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .amount { font-weight: 600; }
        .mt-xl { margin-top: 32px; }

        .modal-sm { max-width: 360px; }
        .contact-info { padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: 20px; }
        .contact-info p { margin: 8px 0; }
        .contact-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .contact-btn { flex: 1; min-width: 100px; justify-content: center; }
        .btn-success { background: #25D366; border-color: #25D366; }
        .btn-success:hover { background: #1da851; }

        .low-stock-items { margin-bottom: 20px; padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: var(--radius-lg); }
        .low-stock-items h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-size: 0.875rem; color: var(--warning); }
        .low-stock-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); }
        .low-stock-item:last-child { border-bottom: none; }
        .stock-warning { color: var(--error); font-size: 0.8125rem; }
        .suggested { color: var(--success); font-size: 0.8125rem; }

        .supplier-select-list { display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto; }
        .supplier-select-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px; background: var(--bg-tertiary);
          border: 2px solid var(--border-subtle); border-radius: var(--radius-lg);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .supplier-select-item:hover { border-color: var(--primary-400); }
        .supplier-select-item.selected { border-color: var(--primary-400); background: rgba(249, 115, 22, 0.1); }
        .supplier-select-item .name { font-weight: 500; display: block; }
        .supplier-select-item .category { font-size: 0.75rem; color: var(--text-tertiary); }
        .check-icon { margin-left: auto; color: var(--primary-400); }
      `}</style>
        </div>
    )
}
