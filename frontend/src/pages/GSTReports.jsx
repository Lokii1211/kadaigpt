import { useState } from 'react'
import { Receipt, Download, FileText, Calendar, Check, Clock, IndianRupee, AlertCircle, ChevronDown } from 'lucide-react'
import { demoGSTData } from '../services/demoData'

export default function GSTReports({ addToast }) {
    const [selectedMonth, setSelectedMonth] = useState('Jan 2026')
    const [generating, setGenerating] = useState(false)
    const [showExportMenu, setShowExportMenu] = useState(false)

    // Check demo mode
    const isDemoMode = localStorage.getItem('kadai_demo_mode') === 'true'

    // Use demo data for demo mode, empty state for real users
    const gstData = isDemoMode ? demoGSTData : {
        summary: { totalSales: 0, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 },
        monthly: [{ month: 'Jan 2026', sales: 0, tax: 0 }],
        invoices: []
    }

    const storeName = localStorage.getItem('kadai_store_name') || 'KadaiGPT Store'
    const gstin = localStorage.getItem('kadai_gstin') || 'Not Configured'

    const handleGenerateGSTR1 = () => {
        setGenerating(true)
        setTimeout(() => {
            setGenerating(false)
            addToast('GSTR-1 report generated successfully!', 'success')
        }, 2000)
    }

    const handleExport = (format) => {
        setShowExportMenu(false)
        addToast(`Exporting as ${format.toUpperCase()}...`, 'info')

        try {
            const selectedData = gstData.monthly.find(m => m.month === selectedMonth) || gstData.monthly[0]

            if (format === 'csv') {
                // Generate CSV
                const headers = ['Invoice No', 'Date', 'Customer GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'Total']
                const rows = gstData.invoices.map(inv => [
                    inv.invoiceNo,
                    inv.date,
                    inv.customerGstin || 'N/A',
                    inv.taxableAmount,
                    inv.cgst,
                    inv.sgst,
                    inv.total
                ])

                const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
                downloadFile(csvContent, `GST_Report_${selectedMonth.replace(' ', '_')}.csv`, 'text/csv')
            } else if (format === 'json') {
                // Generate JSON
                const jsonData = {
                    storeName,
                    gstin,
                    period: selectedMonth,
                    summary: gstData.summary,
                    invoices: gstData.invoices,
                    generatedAt: new Date().toISOString()
                }
                downloadFile(JSON.stringify(jsonData, null, 2), `GST_Report_${selectedMonth.replace(' ', '_')}.json`, 'application/json')
            } else if (format === 'pdf') {
                // Generate simple HTML that can be printed as PDF
                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>GST Report - ${selectedMonth}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 40px; }
                            h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
                            .info { margin: 20px 0; }
                            .info p { margin: 5px 0; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background: #7c3aed; color: white; }
                            tr:nth-child(even) { background: #f9f9f9; }
                            .summary { display: flex; gap: 20px; margin: 20px 0; }
                            .summary-box { background: #f3f4f6; padding: 15px; border-radius: 8px; flex: 1; }
                            .summary-box h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
                            .summary-box p { margin: 0; font-size: 20px; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h1>🧾 GST Report - ${selectedMonth}</h1>
                        <div class="info">
                            <p><strong>Store:</strong> ${storeName}</p>
                            <p><strong>GSTIN:</strong> ${gstin}</p>
                            <p><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</p>
                        </div>
                        <div class="summary">
                            <div class="summary-box">
                                <h3>Total Sales</h3>
                                <p>₹${gstData.summary.totalSales.toLocaleString()}</p>
                            </div>
                            <div class="summary-box">
                                <h3>CGST Collected</h3>
                                <p>₹${gstData.summary.cgst.toLocaleString()}</p>
                            </div>
                            <div class="summary-box">
                                <h3>SGST Collected</h3>
                                <p>₹${gstData.summary.sgst.toLocaleString()}</p>
                            </div>
                        </div>
                        <h2>Invoice Details</h2>
                        <table>
                            <tr>
                                <th>Invoice No</th>
                                <th>Date</th>
                                <th>Taxable Amount</th>
                                <th>CGST</th>
                                <th>SGST</th>
                                <th>Total</th>
                            </tr>
                            ${gstData.invoices.map(inv => `
                                <tr>
                                    <td>${inv.invoiceNo}</td>
                                    <td>${inv.date}</td>
                                    <td>₹${inv.taxableAmount.toLocaleString()}</td>
                                    <td>₹${inv.cgst.toLocaleString()}</td>
                                    <td>₹${inv.sgst.toLocaleString()}</td>
                                    <td>₹${inv.total.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </table>
                        <p style="margin-top: 40px; color: #666; font-size: 12px;">Generated by KadaiGPT - India's AI-Powered Retail Platform</p>
                    </body>
                    </html>
                `

                // Open in new window for printing as PDF
                const printWindow = window.open('', '_blank')
                printWindow.document.write(htmlContent)
                printWindow.document.close()
                printWindow.print()
            }

            addToast(`${format.toUpperCase()} report ready!`, 'success')
        } catch (error) {
            addToast(`Failed to export: ${error.message}`, 'error')
        }
    }

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const gstSlabs = [
        { rate: 0, label: 'Exempt', examples: 'Rice, Wheat, Milk, Vegetables' },
        { rate: 5, label: '5% GST', examples: 'Pulses, Oils, Tea, Coffee' },
        { rate: 12, label: '12% GST', examples: 'Packaged Foods, Processed Items' },
        { rate: 18, label: '18% GST', examples: 'Beverages, Cosmetics, Electronics' },
    ]

    return (
        <div className="gst-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🧾 GST Reports</h1>
                    <p className="page-subtitle">Generate GSTR-1 and track tax compliance</p>
                </div>
                <div className="header-actions">
                    <div className="export-dropdown">
                        <button className="btn btn-secondary" onClick={() => setShowExportMenu(!showExportMenu)}>
                            <Download size={18} /> Export <ChevronDown size={16} />
                        </button>
                        {showExportMenu && (
                            <div className="dropdown-menu">
                                <button onClick={() => handleExport('csv')}>Export as CSV</button>
                                <button onClick={() => handleExport('json')}>Export as JSON</button>
                                <button onClick={() => handleExport('pdf')}>Export as PDF</button>
                            </div>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={handleGenerateGSTR1} disabled={generating}>
                        <FileText size={18} /> {generating ? 'Generating...' : 'Generate GSTR-1'}
                    </button>
                </div>
            </div>

            {/* Store Info */}
            <div className="card store-info-card">
                <div className="store-info">
                    <div>
                        <span className="label">Store Name</span>
                        <span className="value">{storeName}</span>
                    </div>
                    <div>
                        <span className="label">GSTIN</span>
                        <span className="value gstin">{gstin}</span>
                    </div>
                    <div>
                        <span className="label">Filing Period</span>
                        <select className="form-input" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                            {gstData.monthly.map(m => (
                                <option key={m.month} value={m.month}>{m.month}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="gst-stats">
                <div className="stat-card">
                    <IndianRupee size={24} />
                    <div>
                        <span className="value">₹{gstData.summary.totalSales.toLocaleString()}</span>
                        <span className="label">Total Sales</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Receipt size={24} />
                    <div>
                        <span className="value">₹{gstData.summary.taxableAmount.toLocaleString()}</span>
                        <span className="label">Taxable Amount</span>
                    </div>
                </div>
                <div className="stat-card highlight">
                    <FileText size={24} />
                    <div>
                        <span className="value">₹{gstData.summary.totalGST.toLocaleString()}</span>
                        <span className="label">Total GST</span>
                    </div>
                </div>
                <div className="stat-card">
                    <AlertCircle size={24} />
                    <div>
                        <span className="value">₹{gstData.summary.exemptSales.toLocaleString()}</span>
                        <span className="label">Exempt Sales</span>
                    </div>
                </div>
            </div>

            {/* GST Breakdown */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><Receipt size={20} /> Category-wise GST Breakdown</h3>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Sales Amount</th>
                                <th>GST Rate</th>
                                <th>CGST</th>
                                <th>SGST</th>
                                <th>Total GST</th>
                            </tr>
                        </thead>
                        <tbody>
                            {gstData.breakdown.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.category}</td>
                                    <td>₹{item.sales.toLocaleString()}</td>
                                    <td><span className={`rate-badge rate-${item.gstRate}`}>{item.gstRate}%</span></td>
                                    <td>₹{item.cgst.toLocaleString()}</td>
                                    <td>₹{item.sgst.toLocaleString()}</td>
                                    <td className="total-gst">₹{(item.cgst + item.sgst).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total</strong></td>
                                <td><strong>₹{gstData.summary.totalSales.toLocaleString()}</strong></td>
                                <td></td>
                                <td><strong>₹{gstData.summary.cgst.toLocaleString()}</strong></td>
                                <td><strong>₹{gstData.summary.sgst.toLocaleString()}</strong></td>
                                <td className="total-gst"><strong>₹{gstData.summary.totalGST.toLocaleString()}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="gst-grid">
                {/* GST Slabs Info */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">GST Slab Information</h3>
                    </div>
                    <div className="slab-list">
                        {gstSlabs.map((slab, i) => (
                            <div key={i} className={`slab-item slab-${slab.rate}`}>
                                <div className="slab-rate">{slab.rate}%</div>
                                <div className="slab-info">
                                    <span className="slab-label">{slab.label}</span>
                                    <span className="slab-examples">{slab.examples}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filing History */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title"><Calendar size={20} /> Filing History</h3>
                    </div>
                    <div className="filing-history">
                        {gstData.monthly.map((record, i) => (
                            <div key={i} className="filing-item">
                                <div className="filing-info">
                                    <span className="filing-month">{record.month}</span>
                                    <span className="filing-amount">₹{record.sales.toLocaleString()} | GST: ₹{record.gst.toLocaleString()}</span>
                                </div>
                                <div className={`filing-status ${record.filed ? 'filed' : 'pending'}`}>
                                    {record.filed ? <><Check size={14} /> Filed</> : <><Clock size={14} /> Pending</>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        .header-actions { display: flex; gap: 12px; position: relative; }
        .export-dropdown { position: relative; }
        .dropdown-menu {
          position: absolute; top: 100%; right: 0; margin-top: 8px;
          background: var(--bg-card); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); padding: 8px;
          min-width: 160px; z-index: 100;
          box-shadow: var(--shadow-lg);
        }
        .dropdown-menu button {
          width: 100%; padding: 10px 16px; background: none; border: none;
          text-align: left; cursor: pointer; border-radius: var(--radius-md);
          color: var(--text-primary); font-size: 0.875rem;
          transition: background var(--transition-fast);
        }
        .dropdown-menu button:hover { background: var(--bg-tertiary); }

        .store-info-card { margin-bottom: 24px; }
        .store-info { display: flex; gap: 48px; align-items: center; }
        .store-info > div { display: flex; flex-direction: column; }
        .store-info .label { font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px; }
        .store-info .value { font-weight: 600; font-size: 1rem; }
        .store-info .gstin { font-family: var(--font-mono); letter-spacing: 1px; }
        .store-info .form-input { width: 160px; }

        .gst-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 1024px) { .gst-stats { grid-template-columns: repeat(2, 1fr); } }
        .stat-card {
          display: flex; align-items: center; gap: 16px;
          padding: 20px; background: var(--bg-card);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
        }
        .stat-card svg { color: var(--primary-400); }
        .stat-card.highlight { background: var(--gradient-primary); color: white; border: none; }
        .stat-card.highlight svg { color: white; }
        .stat-card .value { font-size: 1.25rem; font-weight: 700; display: block; }
        .stat-card .label { font-size: 0.8125rem; opacity: 0.8; }

        .rate-badge { padding: 4px 10px; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.8125rem; }
        .rate-0 { background: rgba(34, 197, 94, 0.1); color: var(--success); }
        .rate-5 { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .rate-12 { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .rate-18 { background: rgba(239, 68, 68, 0.1); color: var(--error); }
        .total-gst { font-weight: 700; color: var(--primary-400); }
        tfoot td { border-top: 2px solid var(--border-default); padding-top: 16px; }

        .gst-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
        @media (max-width: 1024px) { .gst-grid { grid-template-columns: 1fr; } }

        .slab-list { display: flex; flex-direction: column; gap: 12px; }
        .slab-item { display: flex; align-items: center; gap: 16px; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-lg); }
        .slab-rate { 
          width: 48px; height: 48px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700;
        }
        .slab-0 .slab-rate { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .slab-5 .slab-rate { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .slab-12 .slab-rate { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
        .slab-18 .slab-rate { background: rgba(239, 68, 68, 0.2); color: var(--error); }
        .slab-info { flex: 1; }
        .slab-label { font-weight: 600; display: block; }
        .slab-examples { font-size: 0.75rem; color: var(--text-tertiary); }

        .filing-history { display: flex; flex-direction: column; gap: 12px; }
        .filing-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-tertiary); border-radius: var(--radius-lg); }
        .filing-month { font-weight: 600; display: block; }
        .filing-amount { font-size: 0.75rem; color: var(--text-tertiary); }
        .filing-status { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.8125rem; font-weight: 600; }
        .filing-status.filed { background: rgba(34, 197, 94, 0.1); color: var(--success); }
        .filing-status.pending { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
      `}</style>
        </div>
    )
}
