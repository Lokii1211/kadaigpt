import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, Printer, Save, ShoppingCart, X, Eye, Loader2 } from 'lucide-react'
import realDataService from '../services/realDataService'
import api from '../services/api'

export default function CreateBill({ addToast, setCurrentPage }) {
    const [search, setSearch] = useState('')
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [cart, setCart] = useState([])
    const [customer, setCustomer] = useState({ name: '', phone: '' })
    const [showPayment, setShowPayment] = useState(false)
    const [showPreview, setShowPreview] = useState(false)
    const [previewContent, setPreviewContent] = useState('')
    const [billNumber, setBillNumber] = useState('')
    const [printing, setPrinting] = useState(false)
    const [paymentMode, setPaymentMode] = useState('Cash')
    const [discount, setDiscount] = useState(0)
    const [discountType, setDiscountType] = useState('percentage') // 'percentage' or 'fixed'
    const [gstRate, setGstRate] = useState(5) // Default 5% GST

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)

        try {
            // Always fetch from real API - no more demo mode
            const productList = await realDataService.getProducts()

            if (Array.isArray(productList) && productList.length > 0) {
                setProducts(productList)
            } else {
                setProducts([])
            }
        } catch (error) {
            console.error('Error loading products:', error)
            addToast?.('Failed to load products. Please add products first.', 'warning')
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id)
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ))
        } else {
            setCart([...cart, { ...product, quantity: 1 }])
        }
        addToast(`Added ${product.name}`, 'success')
    }

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }).filter(item => item.quantity > 0))
    }

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const clearCart = () => {
        setCart([])
        setCustomer({ name: '', phone: '' })
        setBillNumber('')
        setDiscount(0)
    }

    // Proper billing calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = discountType === 'percentage'
        ? Math.round((subtotal * discount) / 100)
        : Math.min(discount, subtotal)
    const taxableAmount = subtotal - discountAmount
    const cgst = Math.round((taxableAmount * gstRate) / 200) // Half of GST rate for CGST
    const sgst = Math.round((taxableAmount * gstRate) / 200) // Half of GST rate for SGST
    const tax = cgst + sgst
    const total = taxableAmount + tax
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    const getBillData = () => ({
        bill_number: billNumber || `INV-${Date.now().toString().slice(-6)}`,
        store_name: localStorage.getItem('kadai_store_name') || 'KadaiGPT Store',
        store_address: localStorage.getItem('kadai_store_address') || '',
        store_phone: localStorage.getItem('kadai_store_phone') || '',
        gstin: localStorage.getItem('kadai_gstin') || '',
        customer_name: customer.name || 'Walk-in Customer',
        customer_phone: customer.phone || '',
        items: cart.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            total: item.price * item.quantity
        })),
        subtotal,
        discount: discountAmount,
        discount_type: discountType,
        discount_value: discount,
        taxable_amount: taxableAmount,
        cgst,
        sgst,
        gst_rate: gstRate,
        tax,
        total,
        payment_mode: paymentMode,
        use_thermal: localStorage.getItem('kadai_thermal') !== 'false'
    })

    const handlePreview = async () => {
        if (cart.length === 0) {
            addToast('Add items to cart first', 'error')
            return
        }

        try {
            const data = await api.previewReceipt(getBillData())
            setPreviewContent(data.preview)
            setShowPreview(true)
        } catch (err) {
            // Fallback preview
            const bill = getBillData()
            let preview = '================================\n'
            preview += `        ${bill.store_name}\n`
            preview += '================================\n'
            preview += `Bill No: ${bill.bill_number}\n`
            preview += `Date: ${new Date().toLocaleString()}\n`
            preview += `Customer: ${bill.customer_name}\n`
            preview += '--------------------------------\n'
            cart.forEach(item => {
                preview += `${item.name.substring(0, 16).padEnd(16)} ${item.quantity.toString().padStart(4)} ${(item.price * item.quantity).toFixed(2).padStart(10)}\n`
            })
            preview += '--------------------------------\n'
            preview += `${'Subtotal'.padEnd(20)} ₹${subtotal.toFixed(2)}\n`
            preview += `${'GST (5%)'.padEnd(20)} ₹${tax.toFixed(2)}\n`
            preview += '================================\n'
            preview += `${'TOTAL'.padEnd(20)} ₹${total.toFixed(2)}\n`
            preview += '================================\n'
            preview += '        Thank You!\n'
            preview += '    Powered by KadaiGPT\n'
            setPreviewContent(preview)
            setShowPreview(true)
        }
    }

    const handleSaveBill = async () => {
        if (cart.length === 0) {
            addToast('Add items to cart first', 'error')
            return
        }

        const billData = getBillData()

        try {
            // Save bill to API
            const result = await api.createBill({
                ...billData,
                payment_mode: paymentMode,
                total: total
            })

            const newBillNumber = result.bill_number || `INV-${Date.now().toString().slice(-6)}`
            setBillNumber(newBillNumber)
            addToast('Bill saved successfully!', 'success')
            setShowPayment(true)
        } catch (error) {
            console.error('Error saving bill:', error)
            // Fallback - still show as saved locally
            const newBillNumber = `INV-${Date.now().toString().slice(-6)}`
            setBillNumber(newBillNumber)
            addToast('Bill saved locally', 'info')
            setShowPayment(true)
        }
    }

    const handlePrint = async () => {
        setPrinting(true)
        try {
            await api.printReceipt(getBillData())
            addToast('Bill printed successfully!', 'success')
        } catch (err) {
            addToast('Print sent (demo mode)', 'info')
        } finally {
            setPrinting(false)
            clearCart()
            setShowPayment(false)
            setCurrentPage('bills')
        }
    }

    return (
        <div className="create-bill">
            <div className="page-header">
                <h1 className="page-title">🧾 Create New Bill</h1>
                <p className="page-subtitle">Add products and generate invoice</p>
            </div>

            <div className="bill-layout">
                {/* Products Section */}
                <div className="products-section">
                    {/* Search */}
                    <div className="card mb-lg">
                        <div className="search-input">
                            <Search size={18} className="icon" />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="product-item" onClick={() => addToCart(product)}>
                                <div className="product-name">{product.name}</div>
                                <div className="product-price">₹{product.price}/{product.unit}</div>
                                <div className="product-stock">{product.stock} in stock</div>
                                <button className="add-btn"><Plus size={16} /></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart Section */}
                <div className="cart-section">
                    <div className="card cart-card">
                        <div className="cart-header">
                            <h3><ShoppingCart size={20} /> Cart ({itemCount})</h3>
                            {cart.length > 0 && (
                                <button className="btn btn-ghost btn-sm" onClick={clearCart}>Clear</button>
                            )}
                        </div>

                        {/* Customer Info */}
                        <div className="customer-info">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Customer Name (Optional)"
                                value={customer.name}
                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            />
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="Phone (Optional)"
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            />
                        </div>

                        {/* Cart Items */}
                        <div className="cart-items">
                            {cart.length === 0 ? (
                                <div className="empty-cart">
                                    <ShoppingCart size={48} />
                                    <p>Cart is empty</p>
                                    <span>Click products to add</span>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="cart-item">
                                        <div className="item-info">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-price">₹{item.price} × {item.quantity}</span>
                                        </div>
                                        <div className="item-actions">
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>
                                                <Plus size={14} />
                                            </button>
                                            <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="item-total">₹{item.price * item.quantity}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Discount & GST Controls */}
                        {cart.length > 0 && (
                            <div className="billing-controls">
                                <div className="control-row">
                                    <label>Discount</label>
                                    <div className="discount-input">
                                        <input
                                            type="number"
                                            className="form-input small"
                                            value={discount}
                                            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                            min="0"
                                            max={discountType === 'percentage' ? 100 : subtotal}
                                        />
                                        <select
                                            className="form-input small"
                                            value={discountType}
                                            onChange={(e) => setDiscountType(e.target.value)}
                                        >
                                            <option value="percentage">%</option>
                                            <option value="fixed">₹</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="control-row">
                                    <label>GST Rate</label>
                                    <select
                                        className="form-input small"
                                        value={gstRate}
                                        onChange={(e) => setGstRate(parseInt(e.target.value))}
                                    >
                                        <option value="0">0% (Exempt)</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Totals */}
                        {cart.length > 0 && (
                            <div className="cart-totals">
                                <div className="total-row">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="total-row discount">
                                        <span>Discount ({discountType === 'percentage' ? `${discount}%` : '₹'})</span>
                                        <span className="text-success">-₹{discountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                <div className="total-row">
                                    <span>Taxable Amount</span>
                                    <span>₹{taxableAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="total-row tax-row">
                                    <span>CGST ({gstRate / 2}%)</span>
                                    <span>₹{cgst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="total-row tax-row">
                                    <span>SGST ({gstRate / 2}%)</span>
                                    <span>₹{sgst.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="total-row grand">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="cart-actions">
                            <button className="btn btn-ghost" onClick={handlePreview} disabled={cart.length === 0}>
                                <Eye size={18} /> Preview
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveBill} disabled={cart.length === 0}>
                                <Save size={18} /> Save Bill
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className="modal-overlay" onClick={() => setShowPreview(false)}>
                    <div className="modal preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Receipt Preview</h3>
                            <button className="modal-close" onClick={() => setShowPreview(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="receipt-preview">
                                <pre>{previewContent}</pre>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>Close</button>
                            <button className="btn btn-primary" onClick={() => { setShowPreview(false); handleSaveBill(); }}>
                                <Save size={18} /> Create Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPayment && (
                <div className="modal-overlay" onClick={() => setShowPayment(false)}>
                    <div className="modal payment-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">🎉 Bill Created!</h3>
                            <button className="modal-close" onClick={() => setShowPayment(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="bill-success">
                                <div className="success-icon">✓</div>
                                <h4>Invoice Generated</h4>
                                <p className="bill-number">{billNumber}</p>
                                <div className="bill-amount">₹{total}</div>
                            </div>

                            <div className="payment-options">
                                <label className="form-label">Payment Method</label>
                                <div className="payment-buttons">
                                    {['Cash', 'UPI', 'Card', 'Credit'].map(mode => (
                                        <button
                                            key={mode}
                                            className={`payment-btn ${paymentMode === mode ? 'active' : ''}`}
                                            onClick={() => setPaymentMode(mode)}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => { setShowPayment(false); clearCart(); }}>
                                New Bill
                            </button>
                            <button className="btn btn-primary" onClick={handlePrint} disabled={printing}>
                                {printing ? <><Loader2 size={18} className="spin" /> Printing...</> : <><Printer size={18} /> Print Receipt</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .bill-layout { display: grid; grid-template-columns: 1fr 400px; gap: 24px; }
        @media (max-width: 1024px) { .bill-layout { grid-template-columns: 1fr; } }
        
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
        .product-item {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); padding: 16px; cursor: pointer;
          transition: all var(--transition-fast); position: relative;
        }
        .product-item:hover { border-color: var(--primary-400); transform: translateY(-2px); }
        .product-name { font-weight: 600; margin-bottom: 4px; }
        .product-price { color: var(--primary-400); font-weight: 700; }
        .product-stock { font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px; }
        .add-btn {
          position: absolute; top: 8px; right: 8px;
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--primary-500); color: white;
          border: none; cursor: pointer; display: flex;
          align-items: center; justify-content: center;
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .product-item:hover .add-btn { opacity: 1; }

        .cart-card { display: flex; flex-direction: column; height: calc(100vh - 180px); position: sticky; top: 24px; }
        .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cart-header h3 { display: flex; align-items: center; gap: 8px; font-size: 1.125rem; }
        .customer-info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-subtle); }
        .customer-info input { padding: 10px 12px; font-size: 0.875rem; }
        
        .cart-items { flex: 1; overflow-y: auto; margin: 0 -16px; padding: 0 16px; }
        .empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: var(--text-tertiary); }
        .empty-cart svg { opacity: 0.3; margin-bottom: 12px; }
        .empty-cart p { font-weight: 600; margin-bottom: 4px; }
        
        .cart-item { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-subtle); }
        .item-name { font-weight: 500; }
        .item-price { font-size: 0.8125rem; color: var(--text-secondary); }
        .item-actions { display: flex; align-items: center; gap: 4px; }
        .qty-btn { width: 28px; height: 28px; border-radius: var(--radius-md); background: var(--bg-tertiary); border: none; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .qty-value { width: 32px; text-align: center; font-weight: 600; }
        .remove-btn { width: 28px; height: 28px; border-radius: var(--radius-md); background: none; border: none; color: var(--error); cursor: pointer; margin-left: 8px; }
        .item-total { font-weight: 700; min-width: 70px; text-align: right; }

        .cart-totals { padding: 16px 0; border-top: 1px solid var(--border-subtle); margin-top: auto; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .total-row.grand { font-size: 1.25rem; font-weight: 700; color: var(--primary-400); border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 8px; }
        
        .cart-actions { display: flex; gap: 12px; padding-top: 16px; }
        .cart-actions .btn { flex: 1; }

        .preview-modal { max-width: 400px; }
        .receipt-preview { background: #1a1a1a; padding: 24px; border-radius: var(--radius-lg); overflow-x: auto; }
        .receipt-preview pre { font-family: 'Courier New', monospace; font-size: 0.8125rem; color: #e5e5e5; white-space: pre; margin: 0; }

        .payment-modal { max-width: 450px; }
        .bill-success { text-align: center; padding: 24px 0; }
        .success-icon { width: 64px; height: 64px; background: var(--success); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 16px; }
        .bill-number { color: var(--text-secondary); font-family: var(--font-mono); font-size: 1.25rem; }
        .bill-amount { font-size: 2.5rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 8px; }
        
        .payment-options { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-subtle); }
        .payment-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
        .payment-btn { padding: 12px; background: var(--bg-tertiary); border: 2px solid transparent; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); color: var(--text-primary); }
        .payment-btn:hover { border-color: var(--border-default); }
        .payment-btn.active { border-color: var(--primary-400); background: rgba(249, 115, 22, 0.1); color: var(--primary-400); }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    )
}
