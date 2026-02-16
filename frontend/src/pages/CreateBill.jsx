import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, Printer, Save, ShoppingCart, X, Eye, Loader2, MessageSquare, Send, Package, Scale } from 'lucide-react'
import realDataService from '../services/realDataService'
import whatsappService from '../services/whatsapp'
import api from '../services/api'
import { demoProducts } from '../services/demoData'

const categories = ["All", "Grains", "Pulses", "Essentials", "Oils", "Beverages", "Dairy", "General", "Snacks", "Packaged", "Household", "Personal Care"]

export default function CreateBill({ addToast, setCurrentPage }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
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
  const [discountType, setDiscountType] = useState('percentage')
  const [gstRate, setGstRate] = useState(parseInt(localStorage.getItem('kadai_default_gst_rate') || '5'))
  const [existingCustomer, setExistingCustomer] = useState(null)
  const [redeemPoints, setRedeemPoints] = useState(0)
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false)
  const [usingDemoData, setUsingDemoData] = useState(false)
  const [showQtyModal, setShowQtyModal] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setUsingDemoData(false)

    try {
      // Try to fetch from real API first
      const productList = await realDataService.getProducts()

      if (Array.isArray(productList) && productList.length > 0) {
        setProducts(productList)
        console.log('✅ Loaded', productList.length, 'products from API')
      } else {
        // Fallback to demo products if API returns empty
        console.log('⚠️ No products from API, using demo data')
        setProducts(demoProducts.map(p => ({
          ...p,
          stock: p.stock || 100,
          isDemo: true
        })))
        setUsingDemoData(true)
        addToast?.('Using demo products. Add real products in Products page.', 'info')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      // Fallback to demo products on error
      console.log('⚠️ API error, using demo data')
      setProducts(demoProducts.map(p => ({
        ...p,
        stock: p.stock || 100,
        isDemo: true
      })))
      setUsingDemoData(true)
      addToast?.('Using demo products. Login to access your inventory.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  // Filter by search AND category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const productCategory = (p.category || 'General').toLowerCase()
    const matchesCategory = selectedCategory === 'All' || productCategory === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

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
        const newQty = Math.max(0.1, parseFloat((item.quantity + delta).toFixed(2)))
        return { ...item, quantity: newQty }
      }
      return item
    }).filter(item => item.quantity >= 0.1))
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

  // Add to cart with custom quantity (for weight-based items)
  const addToCartWithQty = (product, qty) => {
    const quantity = parseFloat(qty) || 1
    if (quantity <= 0) {
      addToast('Please enter a valid quantity', 'error')
      return
    }

    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity }])
    }
    addToast(`Added ${quantity} ${product.unit} of ${product.name}`, 'success')
    setShowQtyModal(null)
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

  // Generate 4-digit invoice number
  const generateInvoiceNumber = () => {
    const lastNum = parseInt(localStorage.getItem('kadai_last_invoice') || '0')
    const newNum = (lastNum + 1) % 10000 // Reset after 9999
    localStorage.setItem('kadai_last_invoice', newNum.toString())
    return `INV-${newNum.toString().padStart(4, '0')}`
  }

  const getBillData = () => ({
    // For preview/print - 4 digit invoice number
    bill_number: billNumber || generateInvoiceNumber(),
    store_name: localStorage.getItem('kadai_store_name') || 'KadaiGPT Store',
    store_address: localStorage.getItem('kadai_store_address') || '',
    store_phone: localStorage.getItem('kadai_store_phone') || '',
    gstin: localStorage.getItem('kadai_gstin') || '',

    // Customer info
    customer_name: customer.name || 'Walk-in Customer',
    customer_phone: customer.phone || '',

    // API requires payment_method enum (lowercase)
    payment_method: paymentMode.toLowerCase(),
    amount_paid: total,

    // Items in API format
    items: cart.map(item => ({
      product_id: item.id && typeof item.id === 'number' ? item.id : null,
      product_name: item.name,
      product_sku: item.sku || '',
      unit_price: parseFloat(item.price) || 0,
      quantity: parseFloat(item.quantity) || 1,
      discount_percent: 0,
      tax_rate: gstRate || 0
    })),

    // Legacy fields for print/preview
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
    console.log('📝 Creating bill with payment mode:', paymentMode)
    console.log('📝 Bill data:', billData)
    console.log('📝 Using demo data:', usingDemoData)

    // Generate bill number first
    const newBillNumber = billData.bill_number || `INV-${Date.now().toString().slice(-6)}`
    setBillNumber(newBillNumber)

    // If using demo data, just show success and clear cart
    if (usingDemoData) {
      // Update local stock for demo products
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id)
        if (cartItem) {
          return { ...p, stock: Math.max(0, (p.stock || 0) - cartItem.quantity) }
        }
        return p
      }))

      addToast(`✅ Bill ${newBillNumber} created - ₹${total.toFixed(2)} (Demo Mode)`, 'success')

      // Invalidate cache so Bills page gets fresh data
      realDataService.invalidateCache()

      // Open WhatsApp if phone provided
      if (customer.phone && customer.phone.length >= 10) {
        const storeName = localStorage.getItem('kadai_store_name') || 'KadaiGPT Store'
        const loyaltyPoints = Math.floor(total / 100) * 10
        const itemsList = cart.map(i => `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join('\n')
        const whatsappMessage = `🧾 *BILL - ${newBillNumber}*\n📍 ${storeName}\n\n${itemsList}\n\n💰 *Total: ₹${total.toFixed(2)}*\n📱 Payment: ${paymentMode}\n⭐ Loyalty Points: +${loyaltyPoints}\n\nThank you! 🙏\n_Powered by KadaiGPT_`

        const waUrl = `https://wa.me/91${customer.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
        window.open(waUrl, '_blank')
      }

      setTimeout(() => {
        clearCart()
        addToast('Redirecting to All Bills...', 'info')
        setTimeout(() => setCurrentPage?.('bills'), 500)
      }, 1500)
      return
    }

    try {
      // Save bill to API - backend handles stock updates via inventory_agent
      const result = await api.createBill(billData)
      console.log('✅ Bill created:', result)

      const apiNewBillNumber = result.bill_number || newBillNumber
      setBillNumber(apiNewBillNumber)

      // Update local products state for immediate UI feedback
      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id)
        if (cartItem) {
          const newStock = Math.max(0, (p.stock || p.current_stock || 0) - cartItem.quantity)
          return { ...p, stock: newStock, current_stock: newStock }
        }
        return p
      }))

      // ADD OR UPDATE CUSTOMER
      if (customer.phone && customer.phone.length >= 10) {
        console.log('👤 Processing customer:', customer.phone)
        try {
          const loyaltyPointsEarned = Math.floor(total / 100) * 10
          const pointsToDeduct = redeemPoints || 0

          // Fetch existing customers
          let existingCustomers = []
          try {
            existingCustomers = await api.getCustomers() || []
            console.log('👥 Found', existingCustomers.length, 'existing customers')
          } catch (e) {
            console.log('Could not fetch customers:', e)
          }

          // Match by phone (with or without country code)
          const matchedCustomer = existingCustomers.find(c =>
            c.phone === customer.phone ||
            c.phone === `+91${customer.phone}` ||
            c.phone?.replace(/\D/g, '') === customer.phone.replace(/\D/g, '')
          )

          if (matchedCustomer) {
            console.log('👤 Updating existing customer:', matchedCustomer.id)
            const creditToAdd = paymentMode.toLowerCase() === 'credit' ? total : 0
            const newLoyalty = Math.max(0, (matchedCustomer.loyalty_points || 0) + loyaltyPointsEarned - pointsToDeduct)

            await api.updateCustomer(matchedCustomer.id, {
              total_purchases: (matchedCustomer.total_purchases || 0) + total,
              credit: (matchedCustomer.credit || 0) + creditToAdd,
              loyalty_points: newLoyalty,
              last_purchase: new Date().toISOString()
            })
            console.log('✅ Customer updated')
            addToast(`+${loyaltyPointsEarned} points earned!`, 'success')
          } else {
            console.log('👤 Creating new customer')
            const creditAmount = paymentMode.toLowerCase() === 'credit' ? total : 0

            const newCustomer = await api.createCustomer({
              name: customer.name || 'Walk-in Customer',
              phone: customer.phone,
              email: '',
              address: '',
              credit: creditAmount,
              loyalty_points: loyaltyPointsEarned,
              total_purchases: total,
              last_purchase: new Date().toISOString()
            })
            console.log('✅ Customer created:', newCustomer)
            addToast(`New customer added with ${loyaltyPointsEarned} points!`, 'success')
          }
        } catch (custError) {
          console.error('❌ Customer operation failed:', custError)
          addToast('Customer will be synced later', 'warning')
        }
      }

      // Success! Bill is created
      addToast(`✅ Bill ${apiNewBillNumber} created - ₹${total.toFixed(2)} (${paymentMode})`, 'success')

      // Invalidate cache so Bills/Dashboard pages get fresh data immediately
      realDataService.invalidateCache()

      // Auto-send to WhatsApp if phone provided
      if (customer.phone && customer.phone.length >= 10) {
        const storeName = localStorage.getItem('kadai_store_name') || 'KadaiGPT Store'
        const loyaltyPoints = Math.floor(total / 100) * 10
        const itemsList = cart.map(i => `• ${i.name} x${i.quantity} = ₹${i.price * i.quantity}`).join('\n')
        const whatsappMessage = `🧾 *BILL - ${newBillNumber}*\n📍 ${storeName}\n\n${itemsList}\n\n💰 *Total: ₹${total.toFixed(2)}*\n📱 Payment: ${paymentMode}\n⭐ Loyalty Points: +${loyaltyPoints}\n\nThank you! 🙏\n_Powered by KadaiGPT_`

        const waUrl = `https://wa.me/91${customer.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
        window.open(waUrl, '_blank')
      }

      // Clear cart and navigate to All Bills so user sees the new bill
      setTimeout(() => {
        clearCart()
        addToast('Redirecting to All Bills...', 'info')
        setTimeout(() => setCurrentPage?.('bills'), 500)
      }, 2000)

    } catch (error) {
      console.error('❌ Error saving bill:', error)
      const newBillNumber = `INV-${Date.now().toString().slice(-6)}`
      setBillNumber(newBillNumber)
      addToast('Bill saved locally - will sync when connected', 'warning')
      clearCart()
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
        <div className="header-left">
          <h1 className="page-title">🧾 Create New Bill</h1>
          <p className="page-subtitle">
            Add products and generate invoice
            {usingDemoData && (
              <span className="demo-badge" style={{
                marginLeft: '12px',
                padding: '2px 8px',
                background: 'rgba(249, 115, 22, 0.15)',
                color: '#f97316',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                Demo Mode
              </span>
            )}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentPage?.('dashboard')}
          >
            ← Back
          </button>
        </div>
      </div>

      <div className="bill-layout">
        {/* Products Section */}
        <div className="products-section">
          {/* Search & Category Filters */}
          <div className="product-filters">
            <div className="search-input large">
              <Search size={20} className="icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search products by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="category-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid - Larger cards */}
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <Package size={48} />
                <p>No products found</p>
                <span>{selectedCategory !== 'All' ? `Try "All" category` : 'Add products to get started'}</span>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="product-item" onClick={() => addToCart(product)}>
                  <div className="product-category-tag">{product.category || 'General'}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">₹{product.price}<span>/{product.unit}</span></div>
                  <div className="product-stock">{product.stock} in stock</div>
                  <button className="add-btn" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                    <Plus size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ULTRA-COMPACT CART - Everything visible without scrolling */}
        <div className="cart-panel">
          {/* Header with count */}
          <div className="cart-header">
            <span>🛒 Cart ({cart.length} items, {itemCount} qty)</span>
            {cart.length > 0 && <button onClick={clearCart}>Clear</button>}
          </div>

          {/* Customer - single row */}
          <div className="cart-customer">
            <input type="tel" placeholder="📱 Phone" value={customer.phone}
              onChange={(e) => { setCustomer({ ...customer, phone: e.target.value }); if (e.target.value.length >= 10) lookupCustomer(e.target.value); }} />
            <input type="text" placeholder="👤 Name" value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          </div>

          {/* Items - scrollable area */}
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingCart size={36} style={{ opacity: 0.2, marginBottom: 8 }} />
                <span>Click products to add</span>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-row1">
                  <span className="item-name">{item.name}</span>
                  <span className="item-total">₹{(item.price * item.quantity).toFixed(0)}</span>
                  <button className="item-delete" onClick={() => removeFromCart(item.id)}>×</button>
                </div>
                <div className="item-row2">
                  <span className="item-rate">₹{item.price}/{item.unit || 'pcs'}</span>
                  <div className="qty-group">
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, -(item.unit === 'kg' || item.unit === 'L' ? 0.1 : 1))}>−</button>
                    <input
                      type="number"
                      className="qty-val"
                      value={item.quantity}
                      min="0.1"
                      step={item.unit === 'kg' || item.unit === 'L' ? '0.1' : '1'}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= 0) setCart(cart.map(c => c.id === item.id ? { ...c, quantity: Math.max(0.1, v) } : c));
                      }}
                    />
                    <button className="qty-btn" onClick={() => updateQuantity(item.id, item.unit === 'kg' || item.unit === 'L' ? 0.1 : 1)}>+</button>
                    <select className="unit-sel" value={item.unit || 'pcs'} onChange={(e) => setCart(cart.map(c => c.id === item.id ? { ...c, unit: e.target.value } : c))}>
                      <option value="pcs">pcs</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer - always visible */}
          {cart.length > 0 && (
            <div className="cart-footer">
              {/* Quick controls */}
              <div className="quick-controls">
                <label>Disc <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} />
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}><option value="percentage">%</option><option value="fixed">₹</option></select>
                </label>
                <label>GST <select value={gstRate} onChange={(e) => setGstRate(parseInt(e.target.value))}>
                  <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option>
                </select></label>
              </div>

              {/* Totals inline */}
              <div className="totals-row">
                <span>Sub: ₹{subtotal}</span>
                {discountAmount > 0 && <span style={{ color: '#22c55e' }}>−₹{discountAmount}</span>}
                <span>GST: ₹{tax}</span>
              </div>

              {/* Big total */}
              <div className="total-big">TOTAL ₹{total}</div>

              {/* Payment buttons */}
              <div className="payment-btns">
                {['Cash', 'UPI', 'Card', 'Credit'].map(m => (
                  <button key={m} className={paymentMode === m ? 'active' : ''} onClick={() => setPaymentMode(m)}>{m}</button>
                ))}
              </div>

              {/* Generate bill button */}
              <button className="generate-bill-btn" onClick={handleSaveBill}>
                💾 GENERATE BILL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Quantity Modal */}
      {showQtyModal && (
        <div className="modal-overlay" onClick={() => setShowQtyModal(null)}>
          <div className="modal qty-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title"><Scale size={20} /> Enter Quantity</h3>
              <button className="modal-close" onClick={() => setShowQtyModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="qty-product-info">
                <strong>{showQtyModal.name}</strong>
                <span>₹{showQtyModal.price} per {showQtyModal.unit}</span>
              </div>
              <div className="qty-input-section">
                <label>Quantity / Weight:</label>
                <div className="qty-input-row">
                  <input
                    type="number"
                    id="custom-qty-input"
                    min="0.1"
                    step="0.1"
                    defaultValue="1"
                    autoFocus
                    className="qty-input-large"
                  />
                  <span className="unit-label">{showQtyModal.unit}</span>
                </div>
                <div className="qty-presets">
                  {[0.25, 0.5, 1, 2, 5, 10].map(qty => (
                    <button key={qty} onClick={() => {
                      document.getElementById('custom-qty-input').value = qty
                    }}>
                      {qty} {showQtyModal.unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowQtyModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const qty = document.getElementById('custom-qty-input').value
                  addToCartWithQty(showQtyModal, qty)
                }}
              >
                <Plus size={18} /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

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
        /* ====================================================
           KADAIGPT CREATE BILL - SPLIT LAYOUT
           LEFT: Cart (fixed width) | RIGHT: Products (flex)
           Designed for shop owners who need speed & clarity
           ==================================================== */
        
        .create-bill {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 76px);
          overflow: hidden;
          padding: 0;
        }
        
        /* Page header - minimal */
        .page-header {
          display: none; /* Hide header to maximize billing space */
        }
        
        /* ── MAIN SPLIT LAYOUT ── */
        .bill-layout { 
          display: flex; 
          gap: 0;
          flex: 1;
          overflow: hidden;
          min-height: 0;
          height: 100%;
        }
        
        /* ================================================
           LEFT SIDE: CART PANEL - Full height, always visible
           ================================================ */
        .cart-panel {
          width: 400px;
          min-width: 400px;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          border-right: 1px solid var(--border-subtle);
          overflow: hidden;
          flex-shrink: 0;
          order: -1; /* Force cart to LEFT */
        }
        
        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          color: white;
          font-weight: 700;
          font-size: 1rem;
          flex-shrink: 0;
        }
        .cart-header button {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 5px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          transition: background 0.2s;
        }
        .cart-header button:hover { background: rgba(255,255,255,0.35); }
        
        /* Customer inputs */
        .cart-customer {
          display: flex;
          gap: 6px;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-subtle);
          flex-shrink: 0;
        }
        .cart-customer input {
          flex: 1;
          min-width: 0;
          padding: 8px 12px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .cart-customer input:focus { border-color: var(--primary-400); outline: none; }
        
        /* Cart items list - scrollable middle area */
        .cart-items {
          flex: 1;
          overflow-y: auto;
          padding: 10px 12px;
          min-height: 0;
        }
        .cart-items::-webkit-scrollbar { width: 4px; }
        .cart-items::-webkit-scrollbar-track { background: transparent; }
        .cart-items::-webkit-scrollbar-thumb { background: var(--primary-400); border-radius: 4px; }
        
        .cart-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
          font-size: 0.9rem;
          gap: 8px;
        }
        
        /* Individual cart item card */
        .cart-item {
          background: var(--bg-secondary);
          border-radius: 10px;
          padding: 10px 12px;
          margin-bottom: 8px;
          border: 1px solid var(--border-subtle);
          transition: border-color 0.2s;
        }
        .cart-item:hover { border-color: var(--primary-400); }
        .cart-item:last-child { margin-bottom: 0; }
        
        .item-row1 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .item-row1 .item-name {
          flex: 1;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-row1 .item-total {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--primary-400);
          white-space: nowrap;
        }
        .item-row1 .item-delete {
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0 4px;
          line-height: 1;
          transition: color 0.2s;
        }
        .item-row1 .item-delete:hover { color: #dc2626; }
        
        .item-row2 {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .item-rate {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          min-width: 60px;
        }
        .qty-group {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          justify-content: flex-end;
        }
        .qty-btn {
          width: 30px;
          height: 30px;
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .qty-btn:hover { border-color: var(--primary-400); color: var(--primary-400); background: rgba(249, 115, 22, 0.08); }
        .qty-btn:active { transform: scale(0.92); }
        .qty-val {
          width: 50px;
          padding: 6px 4px;
          text-align: center;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 600;
          -moz-appearance: textfield;
        }
        .qty-val::-webkit-outer-spin-button,
        .qty-val::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .qty-val:focus { border-color: var(--primary-400); outline: none; }
        
        .unit-sel {
          padding: 6px 4px;
          border: 1px solid var(--border-subtle);
          border-radius: 6px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.75rem;
          cursor: pointer;
        }
        .unit-sel:focus { border-color: var(--primary-400); outline: none; }
        
        /* ── Cart Footer: Totals, Payment, Generate ── */
        .cart-footer {
          flex-shrink: 0;
          padding: 10px 12px;
          background: var(--bg-secondary);
          border-top: 2px solid var(--primary-400);
        }
        
        .quick-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .quick-controls label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 500;
        }
        .quick-controls input {
          width: 45px;
          padding: 5px;
          border: 1px solid var(--border-subtle);
          border-radius: 5px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.8rem;
          text-align: center;
        }
        .quick-controls select {
          padding: 5px;
          border: 1px solid var(--border-subtle);
          border-radius: 5px;
          background: var(--bg-card);
          color: var(--text-primary);
          font-size: 0.8rem;
        }
        
        .totals-row {
          display: flex;
          gap: 12px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
          font-weight: 500;
        }
        
        .total-big {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.15));
          color: var(--primary-400);
          font-size: 1.3rem;
          font-weight: 800;
          padding: 10px 14px;
          border-radius: 10px;
          text-align: center;
          margin-bottom: 8px;
          border: 1px solid rgba(249, 115, 22, 0.3);
          letter-spacing: 0.5px;
        }
        
        .payment-btns {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          margin-bottom: 8px;
        }
        .payment-btns button {
          padding: 8px 4px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.15s;
        }
        .payment-btns button:hover { border-color: var(--primary-400); color: var(--primary-400); }
        .payment-btns button.active {
          background: var(--primary-500);
          border-color: var(--primary-500);
          color: white;
        }
        
        .generate-bill-btn {
          width: 100%;
          padding: 14px;
          font-size: 1rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary-500), #ea580c);
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4);
          transition: all 0.2s;
          letter-spacing: 0.3px;
        }
        .generate-bill-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(249, 115, 22, 0.5);
        }
        .generate-bill-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        /* ================================================
           RIGHT SIDE: PRODUCTS BROWSING AREA
           ================================================ */
        .products-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
          padding: 16px 20px 16px 16px;
        }
        
        .product-filters {
          flex-shrink: 0;
          margin-bottom: 12px;
        }
        
        .search-input.large {
          margin-bottom: 10px;
        }
        .search-input.large input {
          padding: 14px 16px 14px 48px;
          font-size: 1rem;
        }
        .search-input.large .icon {
          left: 16px;
        }
        
        .category-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .cat-tab {
          padding: 7px 14px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          border-radius: 20px;
          font-size: 0.8rem;
          cursor: pointer;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        .cat-tab:hover {
          border-color: var(--primary-400);
          color: var(--primary-400);
        }
        .cat-tab.active {
          background: var(--primary-500);
          border-color: var(--primary-500);
          color: white;
        }
        
        /* Products Grid */
        .products-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
          gap: 10px;
          overflow-y: auto;
          flex: 1;
          padding: 4px;
          align-content: start;
        }
        .products-grid::-webkit-scrollbar { width: 4px; }
        .products-grid::-webkit-scrollbar-track { background: transparent; }
        .products-grid::-webkit-scrollbar-thumb { background: var(--primary-400); border-radius: 4px; }
        
        .no-products {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--text-tertiary);
          text-align: center;
        }
        .no-products p { font-size: 1rem; margin: 12px 0 4px; color: var(--text-secondary); }
        .no-products span { font-size: 0.85rem; }
        
        .product-item {
          background: var(--bg-card); 
          border: 1px solid var(--border-subtle);
          border-radius: 12px; 
          padding: 12px; 
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }
        .product-item:hover { 
          border-color: var(--primary-400); 
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        
        .product-category-tag {
          display: inline-block;
          padding: 2px 8px;
          background: var(--bg-tertiary);
          border-radius: 6px;
          font-size: 0.6rem;
          color: var(--text-tertiary);
          margin-bottom: 6px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.3px;
        }
        .product-name { font-weight: 600; margin-bottom: 4px; font-size: 0.85rem; line-height: 1.2; }
        .product-price { color: var(--primary-400); font-weight: 700; font-size: 0.95rem; }
        .product-price span { font-weight: 500; font-size: 0.7rem; color: var(--text-tertiary); }
        .product-stock { font-size: 0.65rem; color: var(--text-tertiary); margin-top: 3px; }
        
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
          transition: all 0.2s;
        }
        .add-btn:hover { background: var(--primary-600); transform: scale(1.15); }
        
        /* ── HEADER (Hidden but kept for structure) ── */
        .header-left { flex: 1; }
        .header-left .page-title { margin-bottom: 0; font-size: 1.3rem; }
        .header-left .page-subtitle { font-size: 0.8rem; margin-top: 2px; }
        .header-actions { display: flex; align-items: center; gap: 12px; }
        
        .cart-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
          color: white;
          padding: 8px 16px;
          border-radius: var(--radius-lg);
          font-weight: 600;
        }
        .badge-count { background: white; color: var(--primary-600); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
        .badge-total { font-size: 1rem; }
        
        /* ── Modals ── */
        .qty-modal { max-width: 400px; }
        .qty-product-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 10px;
          margin-bottom: 20px;
        }
        .qty-product-info strong { font-size: 1.1rem; }
        .qty-product-info span { color: var(--primary-400); }
        .qty-input-section label { display: block; font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px; }
        .qty-input-row { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .qty-input-large {
          flex: 1; padding: 16px; font-size: 1.5rem; font-weight: 700; text-align: center;
          border: 2px solid var(--border-default); border-radius: 12px;
          background: var(--bg-secondary); color: var(--text-primary);
        }
        .qty-input-large:focus { border-color: var(--primary-400); outline: none; }
        .unit-label { font-size: 1.1rem; font-weight: 600; color: var(--text-secondary); min-width: 60px; }
        .qty-presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .qty-presets button {
          padding: 8px 14px; border: 1px solid var(--border-subtle); background: var(--bg-card);
          border-radius: 8px; font-size: 0.8rem; cursor: pointer; color: var(--text-secondary);
        }
        .qty-presets button:hover { border-color: var(--primary-400); color: var(--primary-400); }
        
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
        
        /* Legacy styles kept for compatibility */
        .new-customer-badge { background: rgba(34, 197, 94, 0.1); border: 1px dashed var(--success); border-radius: var(--radius-sm); padding: 8px; font-size: 0.75rem; color: var(--success); text-align: center; }
        .empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 150px; color: var(--text-tertiary); }
        .empty-cart svg { opacity: 0.3; margin-bottom: 8px; }
        .empty-cart p { font-weight: 600; margin-bottom: 4px; font-size: 0.9rem; }
        .empty-cart span { font-size: 0.75rem; }
        .cart-actions { display: none; }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        /* ================================================
           MOBILE LAYOUT (< 900px): Stack vertically
           ================================================ */
        @media (max-width: 900px) {
          .create-bill {
            height: auto;
            overflow: visible;
            padding-bottom: 0;
          }
          
          .bill-layout { 
            flex-direction: column;
            overflow: visible;
            height: auto;
          }
          
          .page-header {
            display: flex !important;
            padding: 12px 16px;
          }
          .header-left .page-title { font-size: 1.1rem; }
          
          /* On mobile: Products on TOP, Cart on BOTTOM (fixed) */
          .products-section {
            overflow: visible;
            padding: 10px 12px;
            padding-bottom: 320px; /* Space for fixed cart */
          }

          .product-filters {
            margin-bottom: 8px;
          }

          .search-input.large input {
            padding: 12px 12px 12px 42px;
            font-size: 0.9rem;
          }

          .category-tabs {
            overflow-x: auto;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-bottom: 4px;
          }
          .category-tabs::-webkit-scrollbar { display: none; }
          .cat-tab {
            white-space: nowrap;
            flex-shrink: 0;
            padding: 6px 12px;
            font-size: 0.75rem;
          }
          
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
            gap: 8px;
            overflow: visible;
            max-height: none;
          }

          .product-item {
            padding: 10px;
          }
          .product-name { font-size: 0.8rem; }
          .product-price { font-size: 0.85rem; }
          .product-stock { font-size: 0.6rem; }
          .product-category-tag { font-size: 0.55rem; padding: 1px 6px; }
          .add-btn { width: 26px; height: 26px; top: 6px; right: 6px; }
          
          .cart-panel {
            position: fixed;
            bottom: 65px;
            left: 0;
            right: 0;
            width: 100%;
            min-width: unset;
            height: auto;
            max-height: 55vh;
            z-index: 100;
            border-right: none;
            border-top: 2px solid var(--primary-400);
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -6px 30px rgba(0,0,0,0.35);
            order: 1;
          }

          .cart-header {
            padding: 10px 14px;
            font-size: 0.9rem;
            border-radius: 20px 20px 0 0;
          }

          .cart-customer {
            padding: 8px 10px;
            gap: 4px;
          }
          .cart-customer input {
            padding: 7px 10px;
            font-size: 0.8rem;
          }
          
          .cart-items {
            max-height: 130px;
            padding: 8px 10px;
          }

          .cart-item {
            padding: 8px 10px;
            margin-bottom: 6px;
          }
          .item-row1 .item-name { font-size: 0.8rem; }
          .item-row1 .item-total { font-size: 0.85rem; }
          .item-rate { font-size: 0.7rem; }
          .qty-btn { width: 28px; height: 28px; font-size: 1rem; }
          .qty-val { width: 42px; font-size: 0.8rem; padding: 5px 2px; }
          .unit-sel { font-size: 0.7rem; padding: 5px 2px; }

          .cart-footer {
            padding: 8px 10px;
          }
          .quick-controls { font-size: 0.7rem; gap: 8px; margin-bottom: 6px; }
          .quick-controls input { width: 40px; padding: 4px; font-size: 0.75rem; }
          .quick-controls select { padding: 4px; font-size: 0.75rem; }
          .totals-row { font-size: 0.75rem; margin-bottom: 4px; }
          .total-big { font-size: 1.1rem; padding: 8px 12px; margin-bottom: 6px; }
          .payment-btns { gap: 3px; margin-bottom: 6px; }
          .payment-btns button { padding: 7px 3px; font-size: 0.75rem; border-radius: 6px; }
          .generate-bill-btn { padding: 12px; font-size: 0.9rem; }

          /* Modals on mobile */
          .modal { margin: 16px; max-width: calc(100vw - 32px) !important; }
          .payment-modal, .preview-modal, .qty-modal { max-width: calc(100vw - 32px) !important; }
        }

        /* Extra small screens */
        @media (max-width: 480px) {
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
            gap: 6px;
          }
          .product-item { padding: 8px; }
          .product-name { font-size: 0.75rem; }
          .product-price { font-size: 0.8rem; }
          .cart-panel { max-height: 60vh; }
        }
      `}</style>
    </div>
  )
}

