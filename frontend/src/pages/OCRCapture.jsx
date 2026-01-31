import { useState, useRef } from 'react'
import { Camera, Upload, FileText, Loader2, Check, AlertCircle, Edit2, Trash2, Plus, Sparkles, Lightbulb, X, Volume2 } from 'lucide-react'
import api from '../services/api'
import ocrService from '../services/ocrService'

export default function OCRCapture({ addToast, setCurrentPage }) {
    const [image, setImage] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [processing, setProcessing] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [editingItem, setEditingItem] = useState(null)
    const [language, setLanguage] = useState('en')
    const fileInputRef = useRef(null)

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'hi', label: 'Hindi' },
        { code: 'ta', label: 'Tamil' },
        { code: 'te', label: 'Telugu' },
    ]

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setError('File too large. Maximum 10MB allowed.')
                return
            }
            setImage(file)
            setImagePreview(URL.createObjectURL(file))
            setResult(null)
            setError('')
        }
    }

    const processImage = async () => {
        if (!image) return

        setProcessing(true)
        setError('')

        try {
            // Use OCR service for extraction
            const extractedData = await ocrService.processImage(image, language)

            if (extractedData.success && extractedData.items.length > 0) {
                setResult(extractedData)
                addToast(`Extracted ${extractedData.items.length} items with ${extractedData.confidence}% confidence!`, 'success')
            } else {
                setError('Could not extract items from this image. Please try a clearer photo.')
                addToast('Extraction failed. Try a clearer image.', 'error')
            }
        } catch (err) {
            console.error('OCR Error:', err)
            setError('Failed to process image. Please try again.')
            addToast('Processing failed', 'error')
        } finally {
            setProcessing(false)
        }
    }

    const handleCreateBill = () => {
        if (result && result.items.length > 0) {
            // Store extracted items in localStorage for CreateBill page
            localStorage.setItem('ocr_items', JSON.stringify(result.items))
            localStorage.setItem('ocr_customer', result.customerName)
            addToast('Items loaded. Redirecting to billing...', 'success')
            setCurrentPage('create-bill')
        }
    }

    const updateItem = (id, field, value) => {
        setResult(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }))
    }

    const deleteItem = (id) => {
        setResult(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }))
    }

    const addItem = () => {
        setResult(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), name: 'New Item', quantity: 1, unit: 'pcs', price: 0, confidence: 100 }]
        }))
    }

    const tips = [
        'Ensure good lighting for better accuracy',
        'Keep the bill flat and avoid wrinkles',
        'Include all corners of the bill in the photo',
        'Handwritten bills work best with clear handwriting',
    ]

    const calculatedTotal = result?.items.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0

    return (
        <div className="ocr-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📷 AI Bill Scanner</h1>
                    <p className="page-subtitle">Digitize handwritten bills with AI</p>
                </div>
                <div className="language-selector">
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            className={`lang-btn ${language === lang.code ? 'active' : ''}`}
                            onClick={() => setLanguage(lang.code)}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="ocr-grid">
                {/* Upload Section */}
                <div className="card upload-section">
                    <h3><Upload size={20} /> Upload Bill Image</h3>

                    <div
                        className={`upload-zone ${imagePreview ? 'has-image' : ''} ${processing ? 'processing' : ''}`}
                        onClick={() => !processing && fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Bill preview" />
                        ) : (
                            <>
                                <Camera size={48} />
                                <p>Click to upload or drag & drop</p>
                                <span>Supports: JPG, PNG, HEIC (Max 10MB)</span>
                            </>
                        )}
                        {processing && (
                            <div className="processing-overlay">
                                <Loader2 size={48} className="spin" />
                                <p>AI is extracting items...</p>
                            </div>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        hidden
                    />

                    <div className="upload-actions">
                        {imagePreview && !processing && (
                            <>
                                <button className="btn btn-secondary" onClick={() => { setImage(null); setImagePreview(null); setResult(null); }}>
                                    <X size={18} /> Clear
                                </button>
                                <button className="btn btn-primary" onClick={processImage}>
                                    <Sparkles size={18} /> Extract with AI
                                </button>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Tips */}
                    <div className="tips-section">
                        <h4><Lightbulb size={16} /> Tips for best results</h4>
                        <ul>
                            {tips.map((tip, i) => (
                                <li key={i}>{tip}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Results Section */}
                <div className="card results-section">
                    <div className="card-header">
                        <h3 className="card-title"><FileText size={20} /> Extracted Items</h3>
                        {result && (
                            <div className="confidence-badge">
                                <Check size={14} />
                                {result.confidence}% accurate
                            </div>
                        )}
                    </div>

                    {!result ? (
                        <div className="empty-state">
                            <Sparkles size={48} />
                            <p>Upload a bill image to extract items</p>
                            <span>Our AI can read handwritten bills in multiple languages</span>
                        </div>
                    ) : (
                        <>
                            {result.customerName && (
                                <div className="customer-info">
                                    <span className="label">Customer:</span>
                                    <span className="value">{result.customerName}</span>
                                </div>
                            )}

                            <div className="items-list">
                                {result.items.map(item => (
                                    <div key={item.id} className="item-row">
                                        <div className="item-main">
                                            {editingItem === item.id ? (
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                    onBlur={() => setEditingItem(null)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="item-name" onClick={() => setEditingItem(item.id)}>
                                                    {item.name}
                                                </span>
                                            )}
                                            <span className={`confidence-indicator conf-${Math.floor(item.confidence / 10)}`}>
                                                {item.confidence}%
                                            </span>
                                        </div>
                                        <div className="item-details">
                                            <input
                                                type="number"
                                                className="qty-input"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.5"
                                            />
                                            <span className="unit">{item.unit}</span>
                                            <span className="multiply">×</span>
                                            <div className="price-input">
                                                <span>₹</span>
                                                <input
                                                    type="number"
                                                    value={item.price}
                                                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                />
                                            </div>
                                            <span className="item-total">= ₹{(item.quantity * item.price).toFixed(2)}</span>
                                            <button className="delete-btn" onClick={() => deleteItem(item.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="btn btn-ghost add-item-btn" onClick={addItem}>
                                <Plus size={16} /> Add Item
                            </button>

                            <div className="results-footer">
                                <div className="total-row">
                                    <span>Total</span>
                                    <span className="total-amount">₹{calculatedTotal.toFixed(2)}</span>
                                </div>
                                <button className="btn btn-primary btn-lg" onClick={handleCreateBill}>
                                    <FileText size={18} /> Create Bill from Extracted Items
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        .language-selector { display: flex; gap: 8px; }
        .lang-btn {
          padding: 8px 16px; background: var(--bg-tertiary);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
          cursor: pointer; font-weight: 500; color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .lang-btn:hover { border-color: var(--primary-400); }
        .lang-btn.active { background: var(--primary-400); color: white; border-color: var(--primary-400); }

        .ocr-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; }
        @media (max-width: 1024px) { .ocr-grid { grid-template-columns: 1fr; } }

        .upload-section h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .upload-zone {
          border: 2px dashed var(--border-default);
          border-radius: var(--radius-xl);
          padding: 48px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
          min-height: 250px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .upload-zone:hover { border-color: var(--primary-400); background: rgba(249, 115, 22, 0.05); }
        .upload-zone.has-image { padding: 16px; border-style: solid; }
        .upload-zone.has-image img { max-width: 100%; max-height: 300px; border-radius: var(--radius-lg); }
        .upload-zone svg { color: var(--text-tertiary); margin-bottom: 16px; }
        .upload-zone p { margin: 0 0 8px; font-weight: 500; }
        .upload-zone span { font-size: 0.8125rem; color: var(--text-tertiary); }
        .processing-overlay {
          position: absolute; inset: 0;
          background: rgba(15, 15, 20, 0.9);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: var(--primary-400);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .upload-actions { display: flex; gap: 12px; margin-top: 16px; }
        .upload-actions .btn { flex: 1; }

        .error-message { display: flex; align-items: center; gap: 8px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); color: var(--error); margin-top: 16px; }

        .tips-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-subtle); }
        .tips-section h4 { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.875rem; color: var(--text-secondary); }
        .tips-section ul { list-style: none; padding: 0; margin: 0; }
        .tips-section li { padding: 6px 0; font-size: 0.8125rem; color: var(--text-tertiary); padding-left: 16px; position: relative; }
        .tips-section li::before { content: '•'; position: absolute; left: 0; color: var(--primary-400); }

        .confidence-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(34, 197, 94, 0.1); color: var(--success); border-radius: var(--radius-sm); font-size: 0.8125rem; font-weight: 600; }
        
        .empty-state { text-align: center; padding: 48px 24px; color: var(--text-tertiary); }
        .empty-state svg { margin-bottom: 16px; opacity: 0.5; }
        .empty-state p { margin: 0 0 8px; font-weight: 500; color: var(--text-secondary); }
        .empty-state span { font-size: 0.8125rem; }

        .customer-info { display: flex; gap: 8px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-md); margin-bottom: 16px; }
        .customer-info .label { color: var(--text-tertiary); }
        .customer-info .value { font-weight: 600; }

        .items-list { display: flex; flex-direction: column; gap: 12px; }
        .item-row { padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-lg); }
        .item-main { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        .item-name { font-weight: 500; cursor: pointer; }
        .item-name:hover { color: var(--primary-400); }
        .confidence-indicator { padding: 2px 8px; border-radius: var(--radius-sm); font-size: 0.6875rem; font-weight: 600; }
        .conf-9, .conf-10 { background: rgba(34, 197, 94, 0.1); color: var(--success); }
        .conf-8 { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .conf-7 { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        
        .item-details { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .qty-input { width: 60px; padding: 6px 10px; text-align: center; }
        .unit { color: var(--text-tertiary); font-size: 0.8125rem; }
        .multiply { color: var(--text-tertiary); }
        .price-input { display: flex; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 0 10px; }
        .price-input span { color: var(--text-tertiary); }
        .price-input input { width: 70px; padding: 6px; background: none; border: none; text-align: right; color: var(--text-primary); }
        .item-total { font-weight: 600; color: var(--primary-400); min-width: 80px; text-align: right; }
        .delete-btn { padding: 6px; background: none; border: none; color: var(--text-tertiary); cursor: pointer; border-radius: var(--radius-sm); }
        .delete-btn:hover { color: var(--error); background: rgba(239, 68, 68, 0.1); }

        .add-item-btn { width: 100%; margin-top: 12px; justify-content: center; }

        .results-footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border-subtle); }
        .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .total-row span:first-child { font-weight: 500; color: var(--text-secondary); }
        .total-amount { font-size: 1.5rem; font-weight: 800; color: var(--primary-400); }
        .results-footer .btn { width: 100%; }
      `}</style>
        </div>
    )
}
