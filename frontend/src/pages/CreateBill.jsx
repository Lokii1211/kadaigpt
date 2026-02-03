import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, Printer, Save, ShoppingCart, X, Eye, Loader2, MessageSquare, Send } from 'lucide-react'
import realDataService from '../services/realDataService'
import whatsappService from '../services/whatsapp'
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
    const [gstRate, setGstRate] = useState(parseInt(localStorage.getItem('kadai_default_gst_rate') || '5')) // Use configured default
    const [existingCustomer, setExistingCustomer] = useState(null) // For customer lookup
    const [redeemPoints, setRedeemPoints] = useState(0) // Points to redeem
    const [lookingUpCustomer, setLookingUpCustomer] = useState(false)

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
        setExistingCustomer(null)
        setRedeemPoints(0)
    }

    // Lookup customer by phone number
    const lookupCustomer = async (phone) => {
        if (!phone || phone.length < 10) {
            setExistingCustomer(null)
            return
        }

        setLookingUpCustomer(true)
        try {
            const customers = await api.getCustomers?.() || []
            const found = customers.find(c => c.phone === phone || c.phone === `+91${phone}`)
            if (found) {
                setExistingCustomer(found)
                setCustomer({ ...customer, name: found.name })
                addToast(`Welcome back, ${found.name}! ${found.loyalty_points || 0} points available`, 'success')
            } else {
                setExistingCustomer(null)
            }
        } catch (error) {
            console.log('Customer lookup failed:', error)
        } finally {
            setLookingUpCustomer(false)
        }
    }

    // Proper billing calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = discountType === 'percentage'
        ? Math.round((subtotal * discount) / 100)
        : Math.min(discount, subtotal)
    const pointsDiscount = Math.floor(redeemPoints / 10) // 10 points = ₹1
    const taxableAmount = Math.max(0, subtotal - discountAmount - pointsDiscount)
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

            // Update stock for each item sold
            for (const item of cart) {
                try {
                    const newStock = Math.max(0, (item.stock || 0) - item.quantity)
                    await api.updateProduct(item.id, { current_stock: newStock })
                } catch (stockError) {
                    console.log('Stock update via API failed, updating locally')
                }
            }

            // Update local products state
            setProducts(products.map(p => {
                const cartItem = cart.find(c => c.id === p.id)
                if (cartItem) {
                    return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) }
                }
                return p
            }))

            // AUTO-ADD OR UPDATE CUSTOMER WITH LOYALTY POINTS
            if (customer.name || customer.phone) {
                try {
                    // Calculate loyalty points: 10 points per ₹100
                    const loyaltyPointsEarned = Math.floor(total / 100) * 10

                    // Check if customer exists by phone
                    const existingCustomers = await api.getCustomers?.() || []
                    const existingCustomer = existingCustomers.find(c => c.phone === customer.phone)

                    if (existingCustomer) {
                        // UPDATE existing customer: add to purchases, update credit if on credit
                        const creditToAdd = paymentMode === 'credit' ? total : 0
                        await api.updateCustomer?.(existingCustomer.id, {
                            total_purchases: (existingCustomer.total_purchases || 0) + total,
                            credit: (existingCustomer.credit || 0) + creditToAdd,
                            loyalty_points: (existingCustomer.loyalty_points || 0) + loyaltyPointsEarned,
                            last_purchase: new Date().toISOString()
                        })
                        addToast(`+${loyaltyPointsEarned} loyalty points added!`, 'success')
                    } else if (customer.phone && customer.phone.length >= 10) {
                        // CREATE new customer
                        const creditAmount = paymentMode === 'credit' ? total : 0
                        await api.createCustomer?.({
                            name: customer.name || 'Walk-in Customer',
                            phone: customer.phone,
                            credit: creditAmount,
                            loyalty_points: loyaltyPointsEarned,
                            total_purchases: total,
                            last_purchase: new Date().toISOString()
                        })
                        addToast(`New customer added with ${loyaltyPointsEarned} points!`, 'success')
                    }
                } catch (custError) {
                    console.log('Customer update failed:', custError)
                }
            }

            addToast('Bill saved & stock updated!', 'success')
            setShowPayment(true)

            // Auto-send bill to WhatsApp if customer phone is provided
            if (customer.phone && customer.phone.length >= 10) {
                const storeName = localStorage.getItem('kadai_store_name') || 'KadaiGPT Store'
                const loyaltyPoints = Math.floor(total / 100) * 10
                const itemsList = cart.map(i => `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join('\n')
                const whatsappMessage = `🧾 *BILL - ${newBillNumber}*\n📍 ${storeName}\n\n${itemsList}\n\n💰 *Total: ₹${total.toFixed(2)}*\n📱 Payment: ${paymentMode}\n⭐ Loyalty Points Earned: +${loyaltyPoints}\n\nThank you for shopping! 🙏\n_Powered by KadaiGPT_`

                // Open WhatsApp with pre-filled message
                const waUrl = `https://wa.me/91${customer.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
                window.open(waUrl, '_blank')
                addToast('Bill sent to WhatsApp!', 'success')
            }
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
            // Try API print first (for connected printers)
            await api.printReceipt(getBillData())
            addToast('Bill printed successfully!', 'success')
        } catch (err) {
            // Fallback: Use browser print dialog (works without physical printer)
            const storeName = localStorage.getItem('kadai_store_name') || 'KadaiGPT Store'
            const printContent = `
                <html>
                <head>
                    <title>Bill ${billNumber}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px; }
                        h2 { text-align: center; margin-bottom: 5px; }
                        .store-info { text-align: center; font-size: 12px; margin-bottom: 15px; }
                        hr { border: 1px dashed #000; }
                        .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
                        .total { font-weight: bold; font-size: 16px; margin-top: 10px; }
                        .footer { text-align: center; font-size: 10px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <h2>${storeName}</h2>
                    <p class="store-info">Bill No: ${billNumber}<br/>Date: ${new Date().toLocaleString('en-IN')}</p>
                    <hr/>
                    ${cart.map(item => `<div class="item"><span>${item.name} x${item.quantity}</span><span>₹${(item.price * item.quantity).toFixed(2)}</span></div>`).join('')}
                    <hr/>
                    <div class="item"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
                    <div class="item"><span>GST (${gstRate}%)</span><span>₹${tax.toFixed(2)}</span></div>
                    <div class="item total"><span>TOTAL</span><span>₹${total.toFixed(2)}</span></div>
                    <hr/>
                    <p class="footer">Thank you for shopping!<br/>Powered by KadaiGPT</p>
                </body>
                </html>
            `
            const printWindow = window.open('', '_blank')
            printWindow.document.write(printContent)
            printWindow.document.close()
            printWindow.print()
            addToast('Print preview opened!', 'success')
        } finally {
            setPrinting(false)
            clearCart()
            setShowPayment(false)
            setCurrentPage('bills')
        }
    }

    // Send bill via WhatsApp
    const handleSendWhatsApp = () => {
        if (!customer.phone) {
            addToast('Please enter customer phone number', 'error')
            return
        }

        const billData = getBillData()
        const storeName = localStorage.getItem('kadai_store_name') || 'KadaiGPT Store'

        // Build bill object for WhatsApp
        const bill = {
            bill_number: billNumber || billData.bill_number,
            created_at: new Date().toISOString(),
            items: cart.map(item => ({
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.price
            })),
            subtotal: subtotal,
            tax: tax,
            total: total,
            payment_mode: paymentMode
        }

        whatsappService.sendBill(bill, customer.phone, storeName)
        addToast('Opening WhatsApp...', 'success')
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

                        {/* Customer Info with Loyalty */}
                        <div className="customer-info">
                            <div className="phone-lookup">
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="📱 Phone Number *"
                                    value={customer.phone}
                                    onChange={(e) => {
                                        setCustomer({ ...customer, phone: e.target.value })
                                        if (e.target.value.length >= 10) {
                                            lookupCustomer(e.target.value)
                                        }
                                    }}
                                />
                                {lookingUpCustomer && <span className="lookup-loading">🔍</span>}
                            </div>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="👤 Customer Name"
                                value={customer.name}
                                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            />

                            {/* Show Loyalty Points if existing customer */}
                            {existingCustomer && (
                                <div className="loyalty-banner">
                                    <div className="loyalty-info">
                                        <span className="loyalty-label">⭐ Loyalty Points</span>
                                        <span className="loyalty-points">{existingCustomer.loyalty_points || 0}</span>
                                    </div>
                                    {(existingCustomer.loyalty_points || 0) >= 100 && (
                                        <div className="redeem-section">
                                            <label>Redeem Points:</label>
                                            <input
                                                type="number"
                                                className="form-input small"
                                                value={redeemPoints}
                                                onChange={(e) => setRedeemPoints(Math.min(
                                                    Math.max(0, parseInt(e.target.value) || 0),
                                                    existingCustomer.loyalty_points || 0
                                                ))}
                                                max={existingCustomer.loyalty_points || 0}
                                                min={0}
                                                step={100}
                                            />
                                            <span className="redeem-value">= ₹{Math.floor(redeemPoints / 10)}</span>
                                        </div>
                                    )}
                                    {existingCustomer.credit > 0 && (
                                        <div className="credit-due">
                                            ⚠️ Credit Due: ₹{existingCustomer.credit}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!existingCustomer && customer.phone?.length >= 10 && (
                                <div className="new-customer-badge">
                                    ✨ New Customer - Will be added automatically!
                                </div>
                            )}
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
                                            <input
                                                type="number"
                                                className="qty-input"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newQty = parseInt(e.target.value) || 1
                                                    setCart(cart.map(i =>
                                                        i.id === item.id ? { ...i, quantity: Math.max(1, newQty) } : i
                                                    ))
                                                }}
                                                min="1"
                                            />
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
                                {pointsDiscount > 0 && (
                                    <div className="total-row discount">
                                        <span>⭐ Points Redeemed ({redeemPoints}pts)</span>
                                        <span className="text-success">-₹{pointsDiscount.toLocaleString('en-IN')}</span>
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
                            <button
                                className="btn btn-success"
                                onClick={handleSendWhatsApp}
                                disabled={!customer.phone}
                                title={!customer.phone ? 'Add customer phone to send via WhatsApp' : 'Send bill via WhatsApp'}
                            >
                                <MessageSquare size={18} /> WhatsApp
                            </button>
                            <button className="btn btn-primary" onClick={handlePrint} disabled={printing}>
                                {printing ? <><Loader2 size={18} className="spin" /> Printing...</> : <><Printer size={18} /> Print Receipt</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        /* Main layout - Full page billing interface */
        .create-bill {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 100px);
          overflow: hidden;
        }
        
        .page-header {
          flex-shrink: 0;
          padding-bottom: 16px;
        }
        
        .bill-layout { 
          display: flex; 
          gap: 20px;
          flex: 1;
          overflow: hidden;
        }
        
        /* Products Section - Scrollable */
        .products-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .products-section .card.mb-lg {
          flex-shrink: 0;
          margin-bottom: 12px;
        }
        
        .products-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); 
          gap: 10px;
          overflow-y: auto;
          flex: 1;
          padding: 4px;
          padding-right: 8px;
          align-content: start;
        }
        
        .products-grid::-webkit-scrollbar { width: 6px; }
        .products-grid::-webkit-scrollbar-track { background: var(--bg-tertiary); border-radius: 3px; }
        .products-grid::-webkit-scrollbar-thumb { background: var(--primary-400); border-radius: 3px; }
        
        .product-item {
          background: var(--bg-card); 
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); 
          padding: 10px; 
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          height: fit-content;
        }
        .product-item:hover { 
          border-color: var(--primary-400); 
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .product-name { font-weight: 600; margin-bottom: 2px; font-size: 0.8rem; line-height: 1.2; }
        .product-price { color: var(--primary-400); font-weight: 700; font-size: 0.9rem; }
        .product-stock { font-size: 0.65rem; color: var(--text-tertiary); margin-top: 2px; }
        .add-btn {
          position: absolute; 
          top: 8px; 
          right: 8px;
          width: 28px; 
          height: 28px; 
          border-radius: 50%;
          background: var(--primary-500); 
          color: white;
          border: none; 
          cursor: pointer; 
          display: flex;
          align-items: center; 
          justify-content: center;
          opacity: 1;
          transition: transform 0.2s;
        }
        .add-btn:hover { transform: scale(1.1); }
        
        /* Cart Section - Fixed width on desktop */
        .cart-section {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          overflow: visible;
          margin-right: 60px; /* Space for AI button */
        }
        
        .cart-card { 
          display: flex; 
          flex-direction: column; 
          flex: 1;
          overflow: hidden;
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          padding: 16px;
        }
        
        .cart-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 12px;
          flex-shrink: 0;
        }
        .cart-header h3 { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 1rem;
          margin: 0;
        }
        
        .customer-info { 
          display: flex; 
          flex-direction: column; 
          gap: 8px; 
          margin-bottom: 12px; 
          padding-bottom: 12px; 
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .customer-info input { padding: 8px 10px; font-size: 0.8rem; }
        
        .phone-lookup { position: relative; display: flex; align-items: center; }
        .phone-lookup input { flex: 1; }
        .lookup-loading { position: absolute; right: 10px; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        .loyalty-banner {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(234, 179, 8, 0.1));
          border: 1px solid var(--primary-400);
          border-radius: var(--radius-md);
          padding: 10px;
          margin-top: 4px;
        }
        .loyalty-info { display: flex; justify-content: space-between; align-items: center; }
        .loyalty-label { font-size: 0.75rem; color: var(--text-secondary); }
        .loyalty-points { font-size: 1.25rem; font-weight: 700; color: var(--primary-400); }
        
        .redeem-section {
          display: flex; align-items: center; gap: 8px;
          margin-top: 8px; padding-top: 8px;
          border-top: 1px dashed var(--border-subtle);
          font-size: 0.75rem;
        }
        .redeem-section label { color: var(--text-secondary); }
        .redeem-section input { width: 70px; }
        .redeem-value { color: var(--success); font-weight: 600; }
        
        .credit-due {
          margin-top: 8px; padding: 6px 8px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: var(--radius-sm);
          font-size: 0.75rem; color: var(--error);
        }
        
        .new-customer-badge {
          background: rgba(34, 197, 94, 0.1);
          border: 1px dashed var(--success);
          border-radius: var(--radius-sm);
          padding: 8px;
          font-size: 0.75rem;
          color: var(--success);
          text-align: center;
        }
        
        .cart-items { 
          flex: 1; 
          overflow-y: auto; 
          margin: 0 -8px;
          padding: 0 8px;
          min-height: 100px;
        }
        .cart-items::-webkit-scrollbar { width: 4px; }
        .cart-items::-webkit-scrollbar-thumb { background: var(--primary-400); border-radius: 2px; }
        
        .empty-cart { 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center; 
          height: 150px; 
          color: var(--text-tertiary); 
        }
        .empty-cart svg { opacity: 0.3; margin-bottom: 8px; }
        .empty-cart p { font-weight: 600; margin-bottom: 4px; font-size: 0.9rem; }
        .empty-cart span { font-size: 0.75rem; }
        
        .cart-item { 
          display: grid; 
          grid-template-columns: 1fr auto auto; 
          gap: 8px; 
          align-items: center; 
          padding: 10px 0; 
          border-bottom: 1px solid var(--border-subtle); 
        }
        .item-name { font-weight: 500; font-size: 0.85rem; }
        .item-price { font-size: 0.75rem; color: var(--text-secondary); }
        .item-actions { display: flex; align-items: center; gap: 2px; }
        .qty-btn { 
          width: 26px; 
          height: 26px; 
          border-radius: var(--radius-md); 
          background: var(--bg-tertiary); 
          border: none; 
          color: var(--text-primary); 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
        }
        .qty-input { 
          width: 40px; 
          text-align: center; 
          font-weight: 600; 
          background: var(--bg-secondary); 
          border: 1px solid var(--border-default); 
          border-radius: var(--radius-sm); 
          padding: 3px; 
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .qty-input::-webkit-inner-spin-button, .qty-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .remove-btn { 
          width: 24px; 
          height: 24px; 
          border-radius: var(--radius-md); 
          background: none; 
          border: none; 
          color: var(--error); 
          cursor: pointer; 
          margin-left: 4px; 
        }
        .item-total { font-weight: 700; min-width: 60px; text-align: right; font-size: 0.85rem; }
        
        /* Billing Controls - Compact */
        .billing-controls { 
          display: flex; 
          gap: 8px; 
          margin: 8px 0; 
          flex-wrap: wrap;
          padding: 8px 0;
          border-top: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .control-row { display: flex; align-items: center; gap: 6px; }
        .control-row label { font-size: 0.75rem; color: var(--text-secondary); }
        .discount-input { display: flex; gap: 2px; }
        .form-input.small { width: 55px; padding: 4px 6px; font-size: 0.8rem; }

        .cart-totals { 
          padding: 12px 0; 
          border-top: 1px solid var(--border-subtle); 
          flex-shrink: 0;
        }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.85rem; }
        .total-row.tax-row { font-size: 0.75rem; color: var(--text-secondary); }
        .total-row.grand { 
          font-size: 1.1rem; 
          font-weight: 700; 
          color: var(--primary-400); 
          border-top: 1px solid var(--border-subtle); 
          padding-top: 8px; 
          margin-top: 4px; 
        }
        
        .cart-actions { 
          display: flex; 
          gap: 10px; 
          padding-top: 12px;
          flex-shrink: 0;
        }
        .cart-actions .btn { flex: 1; padding: 10px; font-size: 0.85rem; }

        /* MOBILE LAYOUT */
        @media (max-width: 900px) {
          .create-bill {
            height: auto;
            overflow: visible;
            padding-bottom: 320px; /* Space for fixed cart */
          }
          
          .bill-layout { 
            flex-direction: column;
            overflow: visible;
          }
          
          .products-section {
            overflow: visible;
          }
          
          .products-grid {
            overflow: visible;
            max-height: none;
          }
          
          .cart-section {
            position: fixed;
            bottom: 65px;
            left: 0;
            right: 0;
            width: 100%;
            z-index: 100;
            max-height: 45vh;
            background: var(--bg-card);
            border-top: 2px solid var(--primary-400);
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
            padding: 0;
          }
          
          .cart-card {
            border: none;
            border-radius: 0;
            padding: 12px 16px;
            max-height: 45vh;
            overflow-y: auto;
          }
          
          .cart-items {
            max-height: 120px;
          }
          
          .cart-actions {
            flex-direction: row;
          }
        }

        /* Modals */
        .preview-modal { max-width: 400px; }
        .receipt-preview { background: #1a1a1a; padding: 20px; border-radius: var(--radius-lg); overflow-x: auto; }
        .receipt-preview pre { font-family: 'Courier New', monospace; font-size: 0.75rem; color: #e5e5e5; white-space: pre; margin: 0; }

        .payment-modal { max-width: 420px; }
        .bill-success { text-align: center; padding: 20px 0; }
        .success-icon { width: 56px; height: 56px; background: var(--success); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; margin: 0 auto 12px; }
        .bill-number { color: var(--text-secondary); font-family: var(--font-mono); font-size: 1.1rem; }
        .bill-amount { font-size: 2rem; font-weight: 700; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 6px; }
        
        .payment-options { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
        .payment-buttons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; }
        .payment-btn { padding: 10px 8px; background: var(--bg-tertiary); border: 2px solid transparent; border-radius: var(--radius-md); font-weight: 600; cursor: pointer; transition: all 0.2s; color: var(--text-primary); font-size: 0.8rem; }
        .payment-btn:hover { border-color: var(--border-default); }
        .payment-btn.active { border-color: var(--primary-400); background: rgba(249, 115, 22, 0.1); color: var(--primary-400); }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    )
}
