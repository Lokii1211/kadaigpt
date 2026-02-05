import { useState, useEffect } from 'react'
import { Search, Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Edit2, Trash2, X, Save, BarChart3, RefreshCw } from 'lucide-react'
import realDataService from '../services/realDataService'
import api from '../services/api'
import EmptyState from '../components/EmptyState'
import FloatingActionButton from '../components/FloatingActionButton'

const categories = ["All", "Grains", "Pulses", "Essentials", "Oils", "Beverages", "Dairy", "General"]

export default function Products({ addToast, setCurrentPage }) {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [category, setCategory] = useState('All')
    const [showLowStock, setShowLowStock] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editProduct, setEditProduct] = useState(null)
    const [newProduct, setNewProduct] = useState({
        name: '', sku: '', price: '', unit: 'kg', stock: '', minStock: '', category: 'Essentials'
    })

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = async () => {
        setLoading(true)

        try {
            // Always fetch from real API - no more demo mode
            const productList = await realDataService.getProducts()

            if (Array.isArray(productList) && productList.length > 0) {
                // Map API fields to component fields
                const mappedProducts = productList.map(p => ({
                    ...p,
                    price: p.price || p.selling_price || 0,
                    stock: p.stock || p.current_stock || 0,
                    minStock: p.minStock || p.min_stock_alert || 10,
                    dailySales: p.dailySales || p.daily_sales || 2,
                    trend: p.trend || 'stable',
                    // Properly map category - handle both string and object formats
                    category: typeof p.category === 'string' ? p.category :
                        (p.category?.name || p.category_name || 'General')
                }))
                setProducts(mappedProducts)
            } else {
                // No products - show empty state
                setProducts([])
            }
        } catch (error) {
            console.error('Failed to load products:', error)
            addToast?.('Failed to load products', 'error')
            setProducts([])
        } finally {
            setLoading(false)
        }
    }

    // Calculate statistics
    const lowStockProducts = products.filter(p => p.stock <= p.minStock)
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
    const outOfStock = products.filter(p => p.stock === 0).length

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = category === 'All' || p.category === category
        const matchesLowStock = !showLowStock || p.stock <= p.minStock
        return matchesSearch && matchesCategory && matchesLowStock
    })

    // Calculate days until stockout
    const getDaysUntilStockout = (product) => {
        if (product.dailySales === 0) return '∞'
        const days = Math.floor(product.stock / product.dailySales)
        return days
    }

    // Stock status
    const getStockStatus = (product) => {
        if (product.stock === 0) return { status: 'out', label: 'Out of Stock', color: 'error' }
        if (product.stock <= product.minStock) return { status: 'low', label: 'Low Stock', color: 'warning' }
        return { status: 'ok', label: 'In Stock', color: 'success' }
    }

    const handleAddProduct = async () => {
        if (!newProduct.name || !newProduct.price || !newProduct.stock) {
            addToast('Please fill in all required fields', 'error')
            return
        }

        const productData = {
            name: newProduct.name,
            sku: newProduct.sku || `SKU${Date.now()}`,
            // Backend API fields (primary)
            selling_price: parseFloat(newProduct.price),
            cost_price: parseFloat(newProduct.price) * 0.8,
            current_stock: parseInt(newProduct.stock),
            min_stock_alert: parseInt(newProduct.minStock) || 10,
            unit: newProduct.unit || 'kg',
            category: newProduct.category || 'Essentials',
            category_id: null,
            description: newProduct.description || '',
        }

        try {
            // Always use real API - no more demo mode
            const result = await api.createProduct(productData)

            // Map the result to our frontend format
            const mappedResult = {
                ...result,
                id: result.id,
                price: result.selling_price || parseFloat(newProduct.price),
                stock: result.current_stock ?? parseInt(newProduct.stock),
                minStock: result.min_stock_alert || parseInt(newProduct.minStock) || 10,
                category: result.category?.name || newProduct.category || 'General',
                dailySales: 2,
                trend: 'stable'
            }

            // Add to local state immediately for instant feedback
            setProducts(prevProducts => [mappedResult, ...prevProducts])
            addToast('✅ Product added successfully!', 'success')

            setShowAddModal(false)
            setNewProduct({ name: '', sku: '', price: '', unit: 'kg', stock: '', minStock: '', category: 'Essentials' })

            // Refresh products list to ensure sync with backend
            setTimeout(() => loadProducts(), 500)
        } catch (error) {
            console.error('Failed to add product:', error)
            addToast(error.message || 'Failed to add product. Please try again.', 'error')
        }
    }

    const handleUpdateStock = async (id, newStock) => {
        try {
            await api.updateProduct(id, { stock: Math.max(0, newStock) })
            setProducts(products.map(p =>
                p.id === id ? { ...p, stock: Math.max(0, newStock) } : p
            ))
            addToast('Stock updated!', 'success')
        } catch (error) {
            addToast(error.message || 'Failed to update stock', 'error')
        }
    }

    const handleDeleteProduct = async (id) => {
        try {
            await api.deleteProduct(id)
            setProducts(products.filter(p => p.id !== id))
            addToast('Product deleted', 'info')
        } catch (error) {
            addToast(error.message || 'Failed to delete product', 'error')
        }
    }

    return (
        <div className="products-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📦 Inventory Management</h1>
                    <p className="page-subtitle">Track stock levels and manage your products</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} /> Add Product
                </button>
            </div>

            {/* Stats Cards */}
            <div className="inventory-stats">
                <div className="stat-card">
                    <Package size={24} />
                    <div>
                        <span className="stat-value">{products.length}</span>
                        <span className="stat-label">Total Products</span>
                    </div>
                </div>
                <div className="stat-card">
                    <BarChart3 size={24} />
                    <div>
                        <span className="stat-value">₹{totalValue.toLocaleString('en-IN')}</span>
                        <span className="stat-label">Inventory Value</span>
                    </div>
                </div>
                <div className="stat-card warning" onClick={() => setShowLowStock(!showLowStock)} style={{ cursor: 'pointer' }}>
                    <AlertTriangle size={24} />
                    <div>
                        <span className="stat-value">{lowStockProducts.length}</span>
                        <span className="stat-label">Low Stock Alerts</span>
                    </div>
                </div>
                <div className="stat-card error">
                    <TrendingDown size={24} />
                    <div>
                        <span className="stat-value">{outOfStock}</span>
                        <span className="stat-label">Out of Stock</span>
                    </div>
                </div>
            </div>

            {/* Low Stock Alert Banner */}
            {lowStockProducts.length > 0 && (
                <div className="alert-banner">
                    <AlertTriangle size={20} />
                    <span><strong>{lowStockProducts.length} products</strong> need restocking: {lowStockProducts.slice(0, 3).map(p => p.name).join(', ')}{lowStockProducts.length > 3 ? '...' : ''}</span>
                    <button className="btn btn-sm btn-warning" onClick={() => setShowLowStock(true)}>View All</button>
                </div>
            )}

            {/* Filters */}
            <div className="card filters-bar">
                <div className="search-input">
                    <Search size={18} className="icon" />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search products by name or SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="category-filters">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`category-btn ${category === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <button className="btn btn-ghost" onClick={loadProducts}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <EmptyState
                    type="products"
                    onAction={() => setShowAddModal(true)}
                />
            ) : (
                <div className="products-grid">
                    {filteredProducts.map(product => {
                        const stockStatus = getStockStatus(product)
                        const daysLeft = getDaysUntilStockout(product)

                        return (
                            <div key={product.id} className={`product-card ${stockStatus.status}`}>
                                <div className="product-header">
                                    <span className="product-category">{product.category}</span>
                                    <span className={`stock-badge ${stockStatus.color}`}>{stockStatus.label}</span>
                                </div>

                                <h3 className="product-name">{product.name}</h3>
                                <p className="product-sku">{product.sku}</p>

                                <div className="product-price">
                                    <span className="price">₹{product.price}</span>
                                    <span className="unit">/{product.unit}</span>
                                </div>

                                <div className="stock-info">
                                    <div className="stock-bar-container">
                                        <div
                                            className={`stock-bar ${stockStatus.color}`}
                                            style={{ width: `${Math.min(100, (product.stock / (product.minStock || 10)) * 50)}%` }}
                                        ></div>
                                    </div>
                                    <div className="stock-numbers">
                                        <span className={`current ${product.stock === 0 ? 'out-of-stock' : product.stock <= product.minStock ? 'low-stock' : ''}`}>
                                            {product.stock} {product.unit}
                                            {product.stock <= product.minStock && product.stock > 0 && ' ⚠️'}
                                            {product.stock === 0 && ' ❌'}
                                        </span>
                                        <span className={`min ${product.stock <= product.minStock ? 'critical' : ''}`}>
                                            Min: {product.minStock || 10}
                                        </span>
                                    </div>
                                </div>

                                <div className="product-prediction">
                                    <div className={`trend ${product.trend}`}>
                                        {product.trend === 'up' ? <TrendingUp size={14} /> : product.trend === 'down' ? <TrendingDown size={14} /> : '→'}
                                        <span>{product.dailySales || 0}/day</span>
                                    </div>
                                    <div className={`days-left ${daysLeft !== '∞' && parseInt(daysLeft) <= 7 ? 'critical' : ''}`}>
                                        {daysLeft === '∞' ? 'No sales data' : `${daysLeft} days left`}
                                    </div>
                                </div>

                                <div className="product-actions">
                                    <div className="quick-stock">
                                        <button onClick={() => handleUpdateStock(product.id, product.stock - 1)}>−</button>
                                        <span>{product.stock}</span>
                                        <button onClick={() => handleUpdateStock(product.id, product.stock + 1)}>+</button>
                                    </div>
                                    <div className="action-btns">
                                        <button className="btn btn-ghost btn-sm" onClick={() => setEditProduct(product)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteProduct(product.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {products.length > 0 && filteredProducts.length === 0 && (
                <div className="empty-state">
                    <Package size={64} />
                    <h3>No products found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            )}

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Product</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Product Name *</label>
                                    <input type="text" className="form-input" placeholder="e.g., Basmati Rice"
                                        value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">SKU</label>
                                    <input type="text" className="form-input" placeholder="e.g., SKU001"
                                        value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Price (₹) *</label>
                                    <input type="number" className="form-input" placeholder="0"
                                        value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <select className="form-input" value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                                        <option value="kg">kg</option>
                                        <option value="g">g</option>
                                        <option value="L">L</option>
                                        <option value="ml">ml</option>
                                        <option value="pcs">pcs</option>
                                        <option value="pack">pack</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Current Stock *</label>
                                    <input type="number" className="form-input" placeholder="0"
                                        value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Minimum Stock Level</label>
                                    <input type="number" className="form-input" placeholder="10"
                                        value={newProduct.minStock} onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-input" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                                    {categories.filter(c => c !== 'All').map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddProduct} disabled={!newProduct.name || !newProduct.price}>
                                <Save size={18} /> Add Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .inventory-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        @media (max-width: 900px) { .inventory-stats { grid-template-columns: repeat(2, 1fr); } }
        .stat-card { 
          display: flex; align-items: center; gap: 16px;
          padding: 20px; background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }
        .stat-card svg { color: var(--primary-400); }
        .stat-card.warning svg { color: var(--warning); }
        .stat-card.error svg { color: var(--error); }
        .stat-value { font-size: 1.5rem; font-weight: 700; display: block; }
        .stat-label { font-size: 0.8125rem; color: var(--text-tertiary); }

        .alert-banner {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 20px; background: rgba(245, 158, 11, 0.1);
          border: 1px solid var(--warning); border-radius: var(--radius-lg);
          margin-bottom: 20px; color: var(--warning);
        }
        .alert-banner span { flex: 1; }

        .filters-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
        .category-filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .category-btn {
          padding: 8px 16px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem;
          transition: all var(--transition-fast); color: var(--text-secondary);
        }
        .category-btn:hover { border-color: var(--primary-400); color: var(--primary-400); }
        .category-btn.active { background: var(--primary-500); color: white; border-color: var(--primary-500); }

        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

        .product-card {
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl); padding: 20px;
          transition: all var(--transition-fast);
        }
        .product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .product-card.low { border-left: 3px solid var(--warning); }
        .product-card.out { border-left: 3px solid var(--error); opacity: 0.8; }

        .product-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .product-category { font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
        .stock-badge { font-size: 0.6875rem; padding: 4px 8px; border-radius: var(--radius-sm); font-weight: 600; }
        .stock-badge.success { background: rgba(34, 197, 94, 0.15); color: var(--success); }
        .stock-badge.warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); }
        .stock-badge.error { background: rgba(239, 68, 68, 0.15); color: var(--error); }

        .product-name { font-size: 1.125rem; font-weight: 600; margin-bottom: 4px; }
        .product-sku { font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px; }
        .product-price { margin-bottom: 16px; }
        .product-price .price { font-size: 1.5rem; font-weight: 700; color: var(--primary-400); }
        .product-price .unit { color: var(--text-tertiary); }

        .stock-info { margin-bottom: 16px; }
        .stock-bar-container { height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
        .stock-bar { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
        .stock-bar.success { background: var(--success); }
        .stock-bar.warning { background: var(--warning); }
        .stock-bar.error { background: var(--error); animation: pulse-error 1.5s infinite; }
        @keyframes pulse-error {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .stock-numbers { display: flex; justify-content: space-between; font-size: 0.8125rem; }
        .stock-numbers .current { font-weight: 600; }
        .stock-numbers .current.low-stock { color: var(--warning); font-weight: 700; }
        .stock-numbers .current.out-of-stock { color: var(--error); font-weight: 700; animation: blink 1s infinite; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .stock-numbers .min { color: var(--text-tertiary); }
        .stock-numbers .min.critical { color: var(--error); font-weight: 600; }

        .product-prediction { display: flex; justify-content: space-between; margin-bottom: 16px; padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md); font-size: 0.8125rem; }
        .trend { display: flex; align-items: center; gap: 4px; }
        .trend.up { color: var(--success); }
        .trend.down { color: var(--error); }
        .days-left { color: var(--text-secondary); }
        .days-left.critical { color: var(--error); font-weight: 600; }

        .product-actions { display: flex; justify-content: space-between; align-items: center; }
        .quick-stock { display: flex; align-items: center; gap: 8px; }
        .quick-stock button { 
          width: 32px; height: 32px; border-radius: var(--radius-md);
          background: var(--bg-tertiary); border: 1px solid var(--border-subtle);
          cursor: pointer; font-size: 1.25rem; color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        .quick-stock button:hover { border-color: var(--primary-400); color: var(--primary-400); }
        .quick-stock span { font-weight: 600; min-width: 40px; text-align: center; }
        .action-btns { display: flex; gap: 4px; }

        .empty-state { text-align: center; padding: 60px; color: var(--text-tertiary); }
        .empty-state svg { opacity: 0.3; margin-bottom: 16px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        
        /* Low stock notification badge */
        .low-stock-indicator {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 12px;
          height: 12px;
          background: var(--error);
          border-radius: 50%;
          animation: pulse-error 1.5s infinite;
        }
      `}</style>
        </div>
    )
}
