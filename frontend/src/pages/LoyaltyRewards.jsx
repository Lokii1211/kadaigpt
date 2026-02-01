import { useState, useEffect } from 'react'
import { Gift, Star, Users, Trophy, ArrowUpRight, Plus, X, Check, Award, Zap, CreditCard, Loader2 } from 'lucide-react'
import api from '../services/api'

// Demo loyalty data
const demoLoyaltyCustomers = [
    { id: 1, name: "Rajesh Kumar", phone: "9876543210", points: 1250, tier: "Gold", totalSpent: 45600, visits: 45 },
    { id: 2, name: "Priya Sharma", phone: "9876543211", points: 580, tier: "Silver", totalSpent: 23400, visits: 32 },
    { id: 3, name: "Amit Patel", phone: "9876543212", points: 2100, tier: "Platinum", totalSpent: 67800, visits: 56 },
    { id: 4, name: "Sunita Verma", phone: "9876543213", points: 180, tier: "Bronze", totalSpent: 12300, visits: 18 },
    { id: 5, name: "Mohan Singh", phone: "9876543214", points: 890, tier: "Silver", totalSpent: 34500, visits: 28 },
]

const loyaltyTiers = [
    { name: "Bronze", minPoints: 0, color: "#cd7f32", discount: 0, icon: "🥉" },
    { name: "Silver", minPoints: 500, color: "#c0c0c0", discount: 2, icon: "🥈" },
    { name: "Gold", minPoints: 1000, color: "#ffd700", discount: 5, icon: "🥇" },
    { name: "Platinum", minPoints: 2000, color: "#e5e4e2", discount: 10, icon: "💎" },
]

const demoRewards = [
    { id: 1, name: "₹50 Off", points: 100, type: "discount" },
    { id: 2, name: "₹100 Off", points: 200, type: "discount" },
    { id: 3, name: "Free Delivery", points: 150, type: "service" },
    { id: 4, name: "1kg Sugar Free", points: 300, type: "product" },
    { id: 5, name: "₹500 Voucher", points: 500, type: "discount" },
]

export default function LoyaltyRewards({ addToast }) {
    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [showRedeemModal, setShowRedeemModal] = useState(false)

    useEffect(() => {
        loadCustomers()
    }, [])

    const loadCustomers = async () => {
        setLoading(true)
        const isDemoMode = localStorage.getItem('kadai_demo_mode') === 'true'

        try {
            if (isDemoMode) {
                setCustomers(demoLoyaltyCustomers)
            } else {
                // Fetch customers from API and calculate loyalty points
                const data = await api.getCustomers()
                const customersWithPoints = (Array.isArray(data) ? data : []).map(c => ({
                    ...c,
                    points: Math.floor((c.totalPurchases || c.total_purchases || 0) / 100),
                    tier: getTierFromPoints(Math.floor((c.totalPurchases || c.total_purchases || 0) / 100))
                }))
                setCustomers(customersWithPoints)
            }
        } catch (error) {
            console.error('Error loading loyalty customers:', error)
            setCustomers([])
        } finally {
            setLoading(false)
        }
    }

    const getTierFromPoints = (points) => {
        if (points >= 2000) return "Platinum"
        if (points >= 1000) return "Gold"
        if (points >= 500) return "Silver"
        return "Bronze"
    }

    const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0)
    const avgPointsPerCustomer = customers.length > 0 ? Math.round(totalPoints / customers.length) : 0

    const getTierInfo = (tierName) => loyaltyTiers.find(t => t.name === tierName)
    const getNextTier = (currentPoints) => {
        return loyaltyTiers.find(t => t.minPoints > currentPoints) || loyaltyTiers[loyaltyTiers.length - 1]
    }

    const handleRedeem = (reward) => {
        if (selectedCustomer && selectedCustomer.points >= reward.points) {
            setCustomers(customers.map(c => {
                if (c.id === selectedCustomer.id) {
                    return { ...c, points: c.points - reward.points }
                }
                return c
            }))
            setShowRedeemModal(false)
            setSelectedCustomer(null)
            addToast(`${reward.name} redeemed for ${selectedCustomer.name}!`, 'success')
        }
    }

    return (
        <div className="loyalty-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🎁 Loyalty & Rewards</h1>
                    <p className="page-subtitle">Retain customers with points and rewards</p>
                </div>
                <button className="btn btn-primary">
                    <Plus size={18} /> Add Points
                </button>
            </div>

            {/* Stats */}
            <div className="loyalty-stats">
                <div className="stat-card">
                    <Gift size={24} />
                    <div>
                        <span className="value">{totalPoints.toLocaleString()}</span>
                        <span className="label">Total Points Issued</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Users size={24} />
                    <div>
                        <span className="value">{customers.length}</span>
                        <span className="label">Loyalty Members</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Star size={24} />
                    <div>
                        <span className="value">{avgPointsPerCustomer}</span>
                        <span className="label">Avg Points/Customer</span>
                    </div>
                </div>
                <div className="stat-card highlight">
                    <Trophy size={24} />
                    <div>
                        <span className="value">{customers.filter(c => c.tier === 'Gold' || c.tier === 'Platinum').length}</span>
                        <span className="label">Premium Members</span>
                    </div>
                </div>
            </div>

            {/* Tier Info */}
            <div className="card tier-info-card">
                <h3>Loyalty Tiers</h3>
                <div className="tiers-grid">
                    {loyaltyTiers.map(tier => (
                        <div key={tier.name} className="tier-item" style={{ borderColor: tier.color }}>
                            <span className="tier-icon">{tier.icon}</span>
                            <span className="tier-name">{tier.name}</span>
                            <span className="tier-requirement">{tier.minPoints}+ pts</span>
                            <span className="tier-benefit">{tier.discount}% off</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Customer List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><Star size={20} /> Loyalty Members</h3>
                </div>
                <div className="loyalty-customers">
                    {customers.map(customer => {
                        const tierInfo = getTierInfo(customer.tier)
                        const nextTier = getNextTier(customer.points)
                        const progress = nextTier ? (customer.points / nextTier.minPoints) * 100 : 100

                        return (
                            <div key={customer.id} className="loyalty-customer-card">
                                <div className="customer-header">
                                    <div className="customer-avatar" style={{ background: tierInfo?.color }}>
                                        {tierInfo?.icon}
                                    </div>
                                    <div className="customer-info">
                                        <h4>{customer.name}</h4>
                                        <span className="customer-phone">{customer.phone}</span>
                                    </div>
                                    <div className="tier-badge" style={{ backgroundColor: tierInfo?.color }}>
                                        {customer.tier}
                                    </div>
                                </div>

                                <div className="points-section">
                                    <div className="points-info">
                                        <span className="current-points">{customer.points.toLocaleString()}</span>
                                        <span className="points-label">Points</span>
                                    </div>
                                    {nextTier && customer.tier !== 'Platinum' && (
                                        <div className="next-tier-progress">
                                            <span className="progress-text">{nextTier.minPoints - customer.points} pts to {nextTier.name}</span>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${Math.min(100, progress)}%` }}></div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="customer-stats">
                                    <div className="stat">
                                        <span className="stat-value">₹{customer.totalSpent.toLocaleString()}</span>
                                        <span className="stat-label">Total Spent</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{customer.visits}</span>
                                        <span className="stat-label">Visits</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{tierInfo?.discount}%</span>
                                        <span className="stat-label">Discount</span>
                                    </div>
                                </div>

                                <div className="customer-actions">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => { setSelectedCustomer(customer); setShowRedeemModal(true); }}
                                    >
                                        <Gift size={14} /> Redeem
                                    </button>
                                    <button className="btn btn-ghost btn-sm">
                                        <Plus size={14} /> Add Points
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Redeem Modal */}
            {showRedeemModal && selectedCustomer && (
                <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Redeem Rewards</h3>
                            <button className="modal-close" onClick={() => setShowRedeemModal(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="redeem-customer">
                                <span className="name">{selectedCustomer.name}</span>
                                <span className="points">{selectedCustomer.points} points available</span>
                            </div>
                            <div className="rewards-grid">
                                {demoRewards.map(reward => (
                                    <div
                                        key={reward.id}
                                        className={`reward-card ${selectedCustomer.points < reward.points ? 'disabled' : ''}`}
                                        onClick={() => selectedCustomer.points >= reward.points && handleRedeem(reward)}
                                    >
                                        <span className="reward-icon">
                                            {reward.type === 'discount' ? '💰' : reward.type === 'product' ? '🎁' : '🚚'}
                                        </span>
                                        <span className="reward-name">{reward.name}</span>
                                        <span className="reward-points">{reward.points} pts</span>
                                        {selectedCustomer.points < reward.points && (
                                            <span className="insufficient">Need {reward.points - selectedCustomer.points} more</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .loyalty-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 1024px) { .loyalty-stats { grid-template-columns: repeat(2, 1fr); } }
        .stat-card {
          display: flex; align-items: center; gap: 16px;
          padding: 20px; background: var(--bg-card);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-xl);
        }
        .stat-card svg { color: var(--primary-400); }
        .stat-card.highlight { background: var(--gradient-primary); color: white; border: none; }
        .stat-card.highlight svg { color: white; }
        .stat-card .value { font-size: 1.5rem; font-weight: 700; display: block; }
        .stat-card .label { font-size: 0.8125rem; opacity: 0.8; }

        .tier-info-card { margin-bottom: 24px; }
        .tier-info-card h3 { margin-bottom: 16px; }
        .tiers-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .tiers-grid { grid-template-columns: repeat(2, 1fr); } }
        .tier-item { 
          text-align: center; padding: 20px; 
          background: var(--bg-tertiary); border-radius: var(--radius-lg);
          border: 2px solid; transition: transform var(--transition-fast);
        }
        .tier-item:hover { transform: translateY(-2px); }
        .tier-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
        .tier-name { font-weight: 700; display: block; margin-bottom: 4px; }
        .tier-requirement { font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 8px; }
        .tier-benefit { font-weight: 600; color: var(--success); }

        .loyalty-customers { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .loyalty-customer-card {
          background: var(--bg-tertiary); border-radius: var(--radius-xl);
          padding: 20px; transition: all var(--transition-fast);
        }
        .loyalty-customer-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }

        .customer-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .customer-avatar { width: 48px; height: 48px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .customer-info h4 { margin: 0 0 2px; }
        .customer-phone { font-size: 0.75rem; color: var(--text-tertiary); }
        .tier-badge { margin-left: auto; padding: 4px 12px; border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 600; color: #1a1a2e; }

        .points-section { margin-bottom: 16px; }
        .points-info { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
        .current-points { font-size: 1.75rem; font-weight: 800; color: var(--primary-400); }
        .points-label { font-size: 0.875rem; color: var(--text-secondary); }
        .next-tier-progress { }
        .progress-text { font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 4px; }
        .progress-bar { height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: var(--gradient-primary); border-radius: 3px; }

        .customer-stats { display: flex; gap: 16px; margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); }
        .stat { text-align: center; flex: 1; }
        .stat-value { font-weight: 600; display: block; }
        .stat-label { font-size: 0.6875rem; color: var(--text-tertiary); }

        .customer-actions { display: flex; gap: 8px; }
        .customer-actions .btn { flex: 1; }

        .redeem-customer { padding: 16px; background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: 20px; text-align: center; }
        .redeem-customer .name { font-weight: 600; display: block; margin-bottom: 4px; }
        .redeem-customer .points { color: var(--primary-400); font-weight: 700; }

        .rewards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .reward-card {
          padding: 20px; text-align: center; background: var(--bg-tertiary);
          border: 2px solid var(--border-subtle); border-radius: var(--radius-lg);
          cursor: pointer; transition: all var(--transition-fast);
        }
        .reward-card:hover:not(.disabled) { border-color: var(--primary-400); transform: translateY(-2px); }
        .reward-card.disabled { opacity: 0.5; cursor: not-allowed; }
        .reward-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
        .reward-name { font-weight: 600; display: block; margin-bottom: 4px; }
        .reward-points { font-size: 0.875rem; color: var(--primary-400); font-weight: 600; display: block; }
        .insufficient { font-size: 0.6875rem; color: var(--error); margin-top: 4px; display: block; }
      `}</style>
        </div>
    )
}
