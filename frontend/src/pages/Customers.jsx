import { useState } from 'react'
import { Users, Search, Plus, Phone, IndianRupee, Calendar, ArrowUpRight, ArrowDownRight, X, Send, Check, AlertCircle } from 'lucide-react'

// Demo customers with credit (Khata)
const demoCustomers = [
    { id: 1, name: "Rajesh Kumar", phone: "9876543210", credit: 2500, lastPurchase: "2026-01-30", totalPurchases: 45600, isPaid: false },
    { id: 2, name: "Priya Sharma", phone: "9876543211", credit: 0, lastPurchase: "2026-01-29", totalPurchases: 23400, isPaid: true },
    { id: 3, name: "Amit Patel", phone: "9876543212", credit: 1850, lastPurchase: "2026-01-28", totalPurchases: 67800, isPaid: false },
    { id: 4, name: "Sunita Verma", phone: "9876543213", credit: 500, lastPurchase: "2026-01-27", totalPurchases: 12300, isPaid: false },
    { id: 5, name: "Mohan Singh", phone: "9876543214", credit: 0, lastPurchase: "2026-01-25", totalPurchases: 34500, isPaid: true },
]

export default function Customers({ addToast }) {
    const [customers, setCustomers] = useState(demoCustomers)
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' })
    const [paymentAmount, setPaymentAmount] = useState('')

    // Statistics
    const totalCredit = customers.reduce((sum, c) => sum + c.credit, 0)
    const customersWithCredit = customers.filter(c => c.credit > 0).length

    // Filter
    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )

    const handleAddCustomer = () => {
        if (!newCustomer.name || !newCustomer.phone) return
        const customer = {
            id: Date.now(),
            name: newCustomer.name,
            phone: newCustomer.phone,
            credit: 0,
            lastPurchase: new Date().toISOString().split('T')[0],
            totalPurchases: 0,
            isPaid: true
        }
        setCustomers([customer, ...customers])
        setNewCustomer({ name: '', phone: '' })
        setShowAddModal(false)
        addToast('Customer added successfully!', 'success')
    }

    const handlePayment = (customerId) => {
        const amount = parseFloat(paymentAmount)
        if (!amount || amount <= 0) return

        setCustomers(customers.map(c => {
            if (c.id === customerId) {
                const newCredit = Math.max(0, c.credit - amount)
                return { ...c, credit: newCredit, isPaid: newCredit === 0 }
            }
            return c
        }))
        setPaymentAmount('')
        setSelectedCustomer(null)
        addToast(`Payment of ₹${amount} recorded!`, 'success')
    }

    const handleAddCredit = (customerId, amount) => {
        setCustomers(customers.map(c => {
            if (c.id === customerId) {
                return { ...c, credit: c.credit + amount, isPaid: false }
            }
            return c
        }))
        addToast(`Added ₹${amount} to credit`, 'info')
    }

    const sendReminder = (customer) => {
        // Simulate WhatsApp/SMS reminder
        addToast(`Reminder sent to ${customer.name} on ${customer.phone}`, 'success')
    }

    return (
        <div className="customers-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">👥 Customer Credit Book (Khata)</h1>
                    <p className="page-subtitle">Manage customer credits and track payments</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Customer
                </button>
            </div>

            {/* Stats */}
            <div className="credit-stats">
                <div className="stat-card">
                    <Users size={24} />
                    <div>
                        <span className="stat-value">{customers.length}</span>
                        <span className="stat-label">Total Customers</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <IndianRupee size={24} />
                    <div>
                        <span className="stat-value">₹{totalCredit.toLocaleString()}</span>
                        <span className="stat-label">Total Pending Credit</span>
                    </div>
                </div>
                <div className="stat-card">
                    <AlertCircle size={24} />
                    <div>
                        <span className="stat-value">{customersWithCredit}</span>
                        <span className="stat-label">With Pending Dues</span>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="card search-bar">
                <div className="search-input">
                    <Search size={18} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search customers by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Customer List */}
            <div className="customers-grid">
                {filteredCustomers.map(customer => (
                    <div key={customer.id} className={`customer-card ${customer.credit > 0 ? 'has-credit' : ''}`}>
                        <div className="customer-header">
                            <div className="customer-avatar">
                                {customer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div className="customer-info">
                                <h3>{customer.name}</h3>
                                <span className="phone"><Phone size={12} /> {customer.phone}</span>
                            </div>
                            {customer.credit > 0 && (
                                <span className="credit-badge">₹{customer.credit} Due</span>
                            )}
                        </div>

                        <div className="customer-stats">
                            <div className="customer-stat">
                                <span className="label">Total Purchases</span>
                                <span className="value">₹{customer.totalPurchases.toLocaleString()}</span>
                            </div>
                            <div className="customer-stat">
                                <span className="label">Last Purchase</span>
                                <span className="value">{new Date(customer.lastPurchase).toLocaleDateString('en-IN')}</span>
                            </div>
                        </div>

                        {customer.credit > 0 && (
                            <div className="credit-section">
                                <div className="credit-amount">
                                    <span>Pending Amount</span>
                                    <span className="amount">₹{customer.credit}</span>
                                </div>
                                <div className="credit-actions">
                                    <button className="btn btn-sm btn-secondary" onClick={() => setSelectedCustomer(customer)}>
                                        <Check size={14} /> Record Payment
                                    </button>
                                    <button className="btn btn-sm btn-ghost" onClick={() => sendReminder(customer)}>
                                        <Send size={14} /> Remind
                                    </button>
                                </div>
                            </div>
                        )}

                        {customer.credit === 0 && (
                            <div className="no-credit">
                                <Check size={16} />
                                <span>All dues cleared</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Customer</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Customer Name *</label>
                                <input type="text" className="form-input" placeholder="Full Name"
                                    value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone Number *</label>
                                <input type="tel" className="form-input" placeholder="10-digit mobile number"
                                    value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddCustomer}>Add Customer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {selectedCustomer && (
                <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Record Payment</h3>
                            <button className="modal-close" onClick={() => setSelectedCustomer(null)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="payment-customer">
                                <div className="customer-avatar large">
                                    {selectedCustomer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </div>
                                <div>
                                    <h4>{selectedCustomer.name}</h4>
                                    <p className="pending">Pending: ₹{selectedCustomer.credit}</p>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Amount (₹)</label>
                                <input
                                    type="number"
                                    className="form-input payment-input"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedCustomer.credit}
                                />
                            </div>
                            <div className="quick-amounts">
                                <button onClick={() => setPaymentAmount(selectedCustomer.credit.toString())}>Full: ₹{selectedCustomer.credit}</button>
                                <button onClick={() => setPaymentAmount(Math.round(selectedCustomer.credit / 2).toString())}>Half: ₹{Math.round(selectedCustomer.credit / 2)}</button>
                                <button onClick={() => setPaymentAmount('500')}>₹500</button>
                                <button onClick={() => setPaymentAmount('1000')}>₹1000</button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Cancel</button>
                            <button className="btn btn-success" onClick={() => handlePayment(selectedCustomer.id)} disabled={!paymentAmount}>
                                <Check size={18} /> Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .credit-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
        @media (max-width: 768px) { .credit-stats { grid-template-columns: 1fr; } }
        .stat-card { 
          display: flex; align-items: center; gap: 16px;
          padding: 20px; background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }
        .stat-card svg { color: var(--primary-400); }
        .stat-card.warning svg { color: var(--warning); }
        .stat-value { font-size: 1.5rem; font-weight: 700; display: block; }
        .stat-label { font-size: 0.8125rem; color: var(--text-tertiary); }

        .search-bar { margin-bottom: 20px; }

        .customers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

        .customer-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl); padding: 20px;
          transition: all var(--transition-fast);
        }
        .customer-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        .customer-card.has-credit { border-left: 3px solid var(--warning); }

        .customer-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
        .customer-avatar {
          width: 48px; height: 48px;
          background: var(--gradient-primary);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: white; font-weight: 700; font-size: 1rem;
        }
        .customer-avatar.large { width: 64px; height: 64px; font-size: 1.25rem; }
        .customer-info h3 { font-size: 1rem; margin-bottom: 4px; }
        .customer-info .phone { display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--text-tertiary); }
        .credit-badge { 
          margin-left: auto; padding: 6px 12px;
          background: rgba(245, 158, 11, 0.15); color: var(--warning);
          border-radius: var(--radius-md); font-size: 0.8125rem; font-weight: 600;
        }

        .customer-stats { display: flex; gap: 24px; margin-bottom: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); }
        .customer-stat .label { display: block; font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 2px; }
        .customer-stat .value { font-weight: 600; }

        .credit-section { padding-top: 16px; border-top: 1px solid var(--border-subtle); }
        .credit-amount { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .credit-amount .amount { font-size: 1.25rem; font-weight: 700; color: var(--warning); }
        .credit-actions { display: flex; gap: 8px; }

        .no-credit { display: flex; align-items: center; gap: 8px; color: var(--success); font-size: 0.875rem; padding-top: 12px; }

        .payment-customer { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-lg); }
        .payment-customer h4 { margin-bottom: 4px; }
        .payment-customer .pending { color: var(--warning); font-weight: 600; }
        .payment-input { font-size: 1.5rem; text-align: center; font-weight: 700; }
        .quick-amounts { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .quick-amounts button {
          padding: 8px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); cursor: pointer; font-size: 0.8125rem;
          transition: all var(--transition-fast); color: var(--text-secondary);
        }
        .quick-amounts button:hover { border-color: var(--primary-400); color: var(--primary-400); }
      `}</style>
        </div>
    )
}
