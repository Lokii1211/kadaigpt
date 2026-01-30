import { useState, useEffect } from 'react'
import {
    Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
    ShoppingCart, Users, Package, IndianRupee, Sparkles,
    Calendar, RefreshCw, ChevronRight, Zap, Target, Award
} from 'lucide-react'

// Simulated AI predictions - In production, this would come from the backend
const generateAIInsights = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    return {
        demandForecast: {
            nextWeekSales: Math.floor(Math.random() * 50000) + 80000,
            growth: (Math.random() * 20 - 5).toFixed(1),
            confidence: (85 + Math.random() * 10).toFixed(0),
            topProducts: [
                { name: 'Basmati Rice', predicted: 45, current: 12 },
                { name: 'Sugar 1kg', predicted: 38, current: 8 },
                { name: 'Coconut Oil', predicted: 28, current: 15 },
            ]
        },
        reorderAlerts: [
            { product: 'Toor Dal', currentStock: 5, minStock: 15, urgency: 'high', daysLeft: 2 },
            { product: 'Wheat Flour', currentStock: 8, minStock: 20, urgency: 'medium', daysLeft: 4 },
            { product: 'Sunflower Oil', currentStock: 12, minStock: 25, urgency: 'low', daysLeft: 7 },
        ],
        customerInsights: {
            churnRisk: [
                { name: 'Ramesh Kumar', lastVisit: '15 days ago', riskScore: 78 },
                { name: 'Priya Sharma', lastVisit: '12 days ago', riskScore: 65 },
            ],
            topCustomers: [
                { name: 'Ganesh Stores', totalSpent: 45000, visits: 28 },
                { name: 'Lakshmi Textiles', totalSpent: 38000, visits: 22 },
            ],
            newCustomerPrediction: isWeekend ? 8 : 5
        },
        pricingSuggestions: [
            { product: 'Ghee 1L', currentPrice: 550, suggestedPrice: 580, reason: 'High demand, low competition' },
            { product: 'Biscuits Pack', currentPrice: 45, suggestedPrice: 40, reason: 'Increase volume sales' },
        ],
        dailyTips: [
            isWeekend
                ? "🎉 Weekend! Expect 40% more footfall. Stock up on beverages and snacks."
                : "📊 Weekday strategy: Focus on bulk buyers and wholesale orders.",
            "💡 Customers who buy Rice often buy Dal within 2 days. Bundle offer suggested!",
            "🎯 Your peak hours are 5-7 PM. Consider extra staff during this time.",
        ],
        weatherImpact: {
            condition: 'Hot & Humid',
            recommendation: 'Stock more cold drinks, buttermilk, and ice cream',
            expectedImpact: '+25% beverage sales'
        }
    }
}

export default function AIInsights({ addToast }) {
    const [insights, setInsights] = useState(null)
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState(null)

    const fetchInsights = async () => {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500))
        setInsights(generateAIInsights())
        setLastUpdated(new Date())
        setLoading(false)
    }

    useEffect(() => {
        fetchInsights()
    }, [])

    if (loading && !insights) {
        return (
            <div className="ai-insights-loading">
                <Brain size={48} className="brain-pulse" />
                <p>KadaiGPT AI is analyzing your business...</p>
                <small>கணிக்கிறது... (Predicting...)</small>
            </div>
        )
    }

    return (
        <div className="ai-insights-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Brain size={28} /> AI Insights
                    </h1>
                    <p className="page-subtitle">
                        Powered by KadaiGPT • புத்திசாலி பரிந்துரைகள்
                    </p>
                </div>
                <div className="header-actions">
                    {lastUpdated && (
                        <span className="last-updated">
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={fetchInsights}
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        {loading ? 'Analyzing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Daily AI Tips */}
            <div className="ai-tips-banner">
                <Sparkles size={20} />
                <div className="tips-carousel">
                    {insights?.dailyTips.map((tip, i) => (
                        <p key={i}>{tip}</p>
                    ))}
                </div>
            </div>

            <div className="insights-grid">
                {/* Demand Forecast */}
                <div className="card insight-card forecast-card">
                    <div className="card-header">
                        <h3><TrendingUp size={20} /> Demand Forecast</h3>
                        <span className="confidence-badge">
                            {insights?.demandForecast.confidence}% Confidence
                        </span>
                    </div>
                    <div className="forecast-content">
                        <div className="big-stat">
                            <IndianRupee size={24} />
                            <span className="value">
                                {insights?.demandForecast.nextWeekSales.toLocaleString()}
                            </span>
                            <span className="label">Predicted Next Week</span>
                        </div>
                        <div className={`growth-indicator ${parseFloat(insights?.demandForecast.growth) >= 0 ? 'positive' : 'negative'}`}>
                            {parseFloat(insights?.demandForecast.growth) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {insights?.demandForecast.growth}% vs last week
                        </div>

                        <h4>🔥 Stock These Products:</h4>
                        <div className="product-predictions">
                            {insights?.demandForecast.topProducts.map((p, i) => (
                                <div key={i} className="prediction-item">
                                    <span className="product-name">{p.name}</span>
                                    <div className="prediction-bar">
                                        <div
                                            className="current"
                                            style={{ width: `${(p.current / p.predicted) * 100}%` }}
                                        />
                                    </div>
                                    <span className="prediction-text">
                                        {p.current} → {p.predicted} units
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Reorder Alerts */}
                <div className="card insight-card alerts-card">
                    <div className="card-header">
                        <h3><AlertTriangle size={20} /> Smart Reorder Alerts</h3>
                        <span className="alert-count">{insights?.reorderAlerts.length} items</span>
                    </div>
                    <div className="alerts-list">
                        {insights?.reorderAlerts.map((alert, i) => (
                            <div key={i} className={`alert-item urgency-${alert.urgency}`}>
                                <div className="alert-info">
                                    <Package size={18} />
                                    <div>
                                        <strong>{alert.product}</strong>
                                        <span>{alert.currentStock} left • Runs out in {alert.daysLeft} days</span>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-ghost">
                                    Order Now <ChevronRight size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button className="btn btn-secondary full-width">
                        <ShoppingCart size={18} /> Generate Purchase Order
                    </button>
                </div>

                {/* Customer Insights */}
                <div className="card insight-card customer-card">
                    <div className="card-header">
                        <h3><Users size={20} /> Customer Intelligence</h3>
                    </div>
                    <div className="customer-sections">
                        <div className="section">
                            <h4>⚠️ Churn Risk - Win Them Back!</h4>
                            {insights?.customerInsights.churnRisk.map((c, i) => (
                                <div key={i} className="churn-item">
                                    <div className="customer-info">
                                        <strong>{c.name}</strong>
                                        <span>Last visit: {c.lastVisit}</span>
                                    </div>
                                    <div className="risk-meter">
                                        <div className="risk-fill" style={{ width: `${c.riskScore}%` }} />
                                    </div>
                                    <button className="btn btn-sm btn-primary">
                                        Send Offer
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="section">
                            <h4>🏆 Top Customers This Month</h4>
                            {insights?.customerInsights.topCustomers.map((c, i) => (
                                <div key={i} className="top-customer">
                                    <Award size={18} className={i === 0 ? 'gold' : 'silver'} />
                                    <div>
                                        <strong>{c.name}</strong>
                                        <span>₹{c.totalSpent.toLocaleString()} • {c.visits} visits</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="prediction-box">
                            <Target size={20} />
                            <span>Expected <strong>{insights?.customerInsights.newCustomerPrediction}</strong> new customers today</span>
                        </div>
                    </div>
                </div>

                {/* Pricing Suggestions */}
                <div className="card insight-card pricing-card">
                    <div className="card-header">
                        <h3><Zap size={20} /> AI Price Optimization</h3>
                    </div>
                    <div className="pricing-suggestions">
                        {insights?.pricingSuggestions.map((p, i) => (
                            <div key={i} className="price-item">
                                <div className="product-info">
                                    <strong>{p.product}</strong>
                                    <span>{p.reason}</span>
                                </div>
                                <div className="price-change">
                                    <span className="old-price">₹{p.currentPrice}</span>
                                    <ChevronRight size={16} />
                                    <span className="new-price">₹{p.suggestedPrice}</span>
                                </div>
                                <button className="btn btn-sm btn-ghost">Apply</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Weather Impact */}
                <div className="card insight-card weather-card">
                    <div className="card-header">
                        <h3><Lightbulb size={20} /> Weather Impact</h3>
                    </div>
                    <div className="weather-content">
                        <div className="weather-condition">
                            <span className="weather-icon">🌡️</span>
                            <strong>{insights?.weatherImpact.condition}</strong>
                        </div>
                        <p className="recommendation">{insights?.weatherImpact.recommendation}</p>
                        <div className="impact-badge positive">
                            <TrendingUp size={16} />
                            {insights?.weatherImpact.expectedImpact}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .ai-insights-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 60vh;
                    gap: 16px;
                    color: var(--text-tertiary);
                }
                .brain-pulse {
                    color: var(--primary-400);
                    animation: pulse 1.5s ease-in-out infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }

                .ai-tips-banner {
                    background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
                    color: white;
                    padding: 16px 24px;
                    border-radius: var(--radius-xl);
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 24px;
                }
                .tips-carousel p {
                    margin: 4px 0;
                    font-size: 0.875rem;
                }
                .tips-carousel p:first-child {
                    font-weight: 600;
                    font-size: 1rem;
                }

                .insights-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 24px;
                }
                @media (max-width: 1200px) {
                    .insights-grid { grid-template-columns: 1fr; }
                }

                .insight-card {
                    min-height: 300px;
                }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                .confidence-badge {
                    background: rgba(34, 197, 94, 0.2);
                    color: var(--success);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .alert-count {
                    background: rgba(239, 68, 68, 0.2);
                    color: var(--error);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }

                .big-stat {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                .big-stat .value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--primary-400);
                }
                .big-stat .label {
                    color: var(--text-tertiary);
                    font-size: 0.875rem;
                }

                .growth-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    margin-bottom: 16px;
                }
                .growth-indicator.positive {
                    background: rgba(34, 197, 94, 0.2);
                    color: var(--success);
                }
                .growth-indicator.negative {
                    background: rgba(239, 68, 68, 0.2);
                    color: var(--error);
                }

                .product-predictions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .prediction-item {
                    display: grid;
                    grid-template-columns: 1fr 100px auto;
                    align-items: center;
                    gap: 12px;
                }
                .prediction-bar {
                    height: 8px;
                    background: var(--bg-tertiary);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .prediction-bar .current {
                    height: 100%;
                    background: var(--warning);
                    border-radius: 4px;
                }
                .prediction-text {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                .alerts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .alert-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-lg);
                    border-left: 4px solid;
                }
                .alert-item.urgency-high { border-color: var(--error); }
                .alert-item.urgency-medium { border-color: var(--warning); }
                .alert-item.urgency-low { border-color: var(--info); }
                .alert-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .alert-info div {
                    display: flex;
                    flex-direction: column;
                }
                .alert-info span {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }

                .customer-sections {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .section h4 {
                    font-size: 0.875rem;
                    margin-bottom: 12px;
                }
                .churn-item, .top-customer {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                }
                .customer-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .customer-info span {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .risk-meter {
                    width: 60px;
                    height: 6px;
                    background: var(--bg-tertiary);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .risk-fill {
                    height: 100%;
                    background: linear-gradient(90deg, var(--warning), var(--error));
                }
                .top-customer .gold { color: #FFD700; }
                .top-customer .silver { color: #C0C0C0; }
                .top-customer div {
                    display: flex;
                    flex-direction: column;
                }
                .top-customer span {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .prediction-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(249, 115, 22, 0.1);
                    border-radius: var(--radius-lg);
                    color: var(--primary-400);
                }

                .pricing-suggestions {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .price-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-lg);
                }
                .product-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .product-info span {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .price-change {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .old-price {
                    color: var(--text-tertiary);
                    text-decoration: line-through;
                }
                .new-price {
                    color: var(--success);
                    font-weight: 600;
                }

                .weather-content {
                    text-align: center;
                    padding: 20px;
                }
                .weather-condition {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin-bottom: 12px;
                }
                .weather-icon {
                    font-size: 2rem;
                }
                .recommendation {
                    color: var(--text-secondary);
                    margin-bottom: 16px;
                }
                .impact-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 500;
                }
                .impact-badge.positive {
                    background: rgba(34, 197, 94, 0.2);
                    color: var(--success);
                }

                .full-width { width: 100%; }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .last-updated {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
