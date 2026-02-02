import { useState } from 'react'
import { Shield, Mail, Lock, ArrowRight, Loader2, Users, Store, UserCog, Eye, EyeOff } from 'lucide-react'
import api from '../services/api'

export default function AdminLogin({ onLogin }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loginType, setLoginType] = useState('admin') // 'admin', 'owner', 'staff'
    const [form, setForm] = useState({
        email: '',
        password: '',
        storeCode: '' // For staff login
    })

    const loginTypes = [
        { id: 'admin', label: 'Super Admin', icon: Shield, color: '#ef4444', description: 'Full system access' },
        { id: 'owner', label: 'Store Owner', icon: Store, color: '#22c55e', description: 'Manage your store' },
        { id: 'staff', label: 'Staff/Cashier', icon: Users, color: '#3b82f6', description: 'Basic operations' },
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Clear demo mode
            localStorage.removeItem('kadai_demo_mode')

            // Login with role
            const response = await api.login(form.email, form.password)

            // Get user profile with role
            const user = await api.getProfile()

            // Store role for access control
            const role = loginType // In real app, this comes from backend
            localStorage.setItem('kadai_user_role', role)

            // Validate role access
            if (loginType === 'admin' && user.role !== 'super_admin') {
                setError('You do not have admin access')
                setLoading(false)
                return
            }

            // For staff, validate store code
            if (loginType === 'staff' && form.storeCode) {
                // Validate store code logic here
            }

            onLogin({
                ...user,
                role: role,
                isAdmin: role === 'admin',
                isOwner: role === 'owner',
                isStaff: role === 'staff'
            })

        } catch (err) {
            console.error('Login error:', err)
            setError(err?.message || 'Invalid credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                {/* Role Selection */}
                <div className="role-selector">
                    <div className="logo-section">
                        <Shield size={48} className="logo-icon" />
                        <h1>KadaiGPT</h1>
                        <p>Secure Access Portal</p>
                    </div>

                    <div className="role-cards">
                        {loginTypes.map(type => (
                            <button
                                key={type.id}
                                className={`role-card ${loginType === type.id ? 'active' : ''}`}
                                onClick={() => setLoginType(type.id)}
                                style={{ '--accent-color': type.color }}
                            >
                                <div className="role-icon" style={{ background: type.color }}>
                                    <type.icon size={24} />
                                </div>
                                <div className="role-info">
                                    <h3>{type.label}</h3>
                                    <span>{type.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Login Form */}
                <div className="login-form-section">
                    <div className="form-header">
                        <h2>{loginTypes.find(t => t.id === loginType)?.label} Login</h2>
                        <p>Enter your credentials to continue</p>
                    </div>

                    {error && <div className="error-alert">{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <div className="input-icon">
                                <Mail size={18} />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="your@email.com"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-icon">
                                <Lock size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Staff Store Code */}
                        {loginType === 'staff' && (
                            <div className="form-group">
                                <label className="form-label">Store Code</label>
                                <div className="input-icon">
                                    <Store size={18} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter store code"
                                        value={form.storeCode}
                                        onChange={(e) => setForm({ ...form, storeCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <span className="form-hint">Get this from your store owner</span>
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin" /> Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="form-footer">
                        <a href="#forgot">Forgot Password?</a>
                        <span className="divider">•</span>
                        <a href="#help">Need Help?</a>
                    </div>

                    {/* Access Level Info */}
                    <div className="access-info">
                        <h4>Access Levels:</h4>
                        <ul>
                            <li><strong>Admin:</strong> Full system, all stores, user management</li>
                            <li><strong>Owner:</strong> Complete store management, reports, settings</li>
                            <li><strong>Staff:</strong> Billing, products view, customer lookup</li>
                        </ul>
                    </div>
                </div>
            </div>

            <style>{`
                .admin-login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    padding: 20px;
                }

                .admin-login-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    max-width: 900px;
                    width: 100%;
                    background: var(--bg-card);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }

                .role-selector {
                    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }

                .logo-section {
                    text-align: center;
                    color: white;
                }
                .logo-section .logo-icon {
                    color: #8b5cf6;
                    margin-bottom: 12px;
                }
                .logo-section h1 {
                    font-size: 1.75rem;
                    margin: 0;
                }
                .logo-section p {
                    opacity: 0.7;
                    margin: 4px 0 0;
                }

                .role-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .role-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid transparent;
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-align: left;
                }
                .role-card:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--accent-color);
                }
                .role-card.active {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: var(--accent-color);
                    box-shadow: 0 0 20px rgba(var(--accent-color), 0.3);
                }

                .role-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }

                .role-info h3 {
                    color: white;
                    margin: 0;
                    font-size: 1rem;
                }
                .role-info span {
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.75rem;
                }

                .login-form-section {
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .form-header h2 {
                    margin: 0;
                    font-size: 1.5rem;
                }
                .form-header p {
                    color: var(--text-secondary);
                    margin: 4px 0 0;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 12px 16px;
                    border-radius: var(--radius-lg);
                    font-size: 0.875rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .form-label {
                    font-weight: 500;
                    font-size: 0.875rem;
                }

                .input-icon {
                    position: relative;
                }
                .input-icon svg:first-child {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-tertiary);
                }
                .input-icon .form-input {
                    padding-left: 44px;
                }
                .password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-tertiary);
                    cursor: pointer;
                    padding: 4px;
                }

                .btn-block {
                    width: 100%;
                    justify-content: center;
                    padding: 14px;
                    font-size: 1rem;
                    margin-top: 8px;
                }

                .form-footer {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    font-size: 0.875rem;
                }
                .form-footer a {
                    color: var(--primary-400);
                    text-decoration: none;
                }
                .form-footer a:hover {
                    text-decoration: underline;
                }
                .form-footer .divider {
                    color: var(--text-tertiary);
                }

                .access-info {
                    margin-top: auto;
                    padding: 16px;
                    background: var(--bg-secondary);
                    border-radius: var(--radius-lg);
                    font-size: 0.75rem;
                }
                .access-info h4 {
                    margin: 0 0 8px;
                    font-size: 0.8125rem;
                }
                .access-info ul {
                    margin: 0;
                    padding-left: 16px;
                    color: var(--text-secondary);
                }
                .access-info li {
                    margin-bottom: 4px;
                }

                .form-hint {
                    font-size: 0.75rem;
                    color: var(--text-tertiary);
                    margin-top: 4px;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .admin-login-container {
                        grid-template-columns: 1fr;
                    }
                    .role-selector {
                        padding: 24px;
                    }
                    .role-cards {
                        flex-direction: row;
                        overflow-x: auto;
                        gap: 8px;
                        padding-bottom: 8px;
                    }
                    .role-card {
                        flex-shrink: 0;
                        flex-direction: column;
                        text-align: center;
                        padding: 12px;
                        min-width: 100px;
                    }
                    .role-info span {
                        display: none;
                    }
                    .login-form-section {
                        padding: 24px;
                    }
                }
            `}</style>
        </div>
    )
}
