import { useState } from 'react'
import { ShoppingCart, Mail, Lock, User, ArrowRight, Loader2, Sparkles, Zap, Shield, Wifi } from 'lucide-react'
import api from '../services/api'

export default function Login({ onLogin }) {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        storeName: '',
    })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (isLogin) {
                await api.login(form.username, form.password)
                const user = await api.getProfile()
                onLogin(user)
            } else {
                await api.register({
                    username: form.username,
                    email: form.email,
                    password: form.password,
                    store_name: form.storeName,
                })
                await api.login(form.username, form.password)
                const user = await api.getProfile()
                onLogin(user)
            }
        } catch (err) {
            // Handle different error formats
            const errorMessage = typeof err === 'string' ? err
                : err?.message
                || err?.detail
                || (err?.response?.data?.detail)
                || 'Something went wrong. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleDemo = () => {
        onLogin({ username: 'demo', store_name: 'Demo Store' })
    }

    const features = [
        { icon: Sparkles, text: 'AI-Powered Bill Scanning' },
        { icon: Zap, text: 'Instant Silent Printing' },
        { icon: Wifi, text: 'Works Offline' },
        { icon: Shield, text: 'GST Compliant' },
    ]

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left - Branding */}
                <div className="login-brand">
                    <div className="brand-content">
                        <div className="brand-logo">
                            <ShoppingCart size={40} />
                        </div>
                        <h1>KadaiGPT</h1>
                        <p className="tagline">AI-Powered Retail Intelligence</p>
                        <p className="tamil-tagline">கடை சிறியது, கனவுகள் பெரியது</p>
                        <p className="description">
                            India's first Agentic AI platform for retail. Voice commands in Tamil, Hindi & Telugu.
                            Predictive analytics, WhatsApp integration, and works 100% offline.
                        </p>

                        <div className="features-grid">
                            {features.map((feature, i) => (
                                <div key={i} className="feature-item">
                                    <feature.icon size={20} />
                                    <span>{feature.text}</span>
                                </div>
                            ))}
                        </div>

                        <div className="trust-badges">
                            <div className="badge-item">
                                <span className="badge-number">10,000+</span>
                                <span className="badge-text">Bills Processed</span>
                            </div>
                            <div className="badge-item">
                                <span className="badge-number">500+</span>
                                <span className="badge-text">Happy Stores</span>
                            </div>
                            <div className="badge-item">
                                <span className="badge-number">99.9%</span>
                                <span className="badge-text">Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="login-form-section">
                    <div className="form-container">
                        <h2>{isLogin ? 'Welcome Back!' : 'Get Started Free'}</h2>
                        <p className="form-subtitle">
                            {isLogin ? 'Sign in to your store account' : 'Create your AI-powered store in seconds'}
                        </p>

                        {error && <div className="error-alert">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <div className="input-icon">
                                    <User size={18} />
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter your username"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {!isLogin && (
                                <>
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
                                        <label className="form-label">Store Name</label>
                                        <div className="input-icon">
                                            <ShoppingCart size={18} />
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Your Store Name"
                                                value={form.storeName}
                                                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-icon">
                                    <Lock size={18} />
                                    <input
                                        type="password"
                                        className="form-input"
                                        placeholder="Enter your password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                                {loading ? <Loader2 size={20} className="spin" /> : <><span>{isLogin ? 'Sign In' : 'Create Account'}</span><ArrowRight size={18} /></>}
                            </button>
                        </form>

                        <div className="divider"><span>or continue with</span></div>

                        <button className="btn btn-demo btn-lg w-full" onClick={handleDemo}>
                            <Sparkles size={18} />
                            Try Demo Mode - No Login Required
                        </button>

                        <p className="switch-mode">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button onClick={() => setIsLogin(!isLogin)}>
                                {isLogin ? 'Sign Up Free' : 'Sign In'}
                            </button>
                        </p>

                        <p className="terms-text">
                            By continuing, you agree to our Terms of Service and Privacy Policy
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: linear-gradient(135deg, var(--bg-primary) 0%, #1a1a2e 100%);
        }
        .login-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          max-width: 1100px;
          width: 100%;
          background: var(--bg-secondary);
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid var(--border-subtle);
        }
        @media (max-width: 900px) {
          .login-container { grid-template-columns: 1fr; }
          .login-brand { display: none; }
        }
        .login-brand {
          background: var(--gradient-primary);
          padding: 48px;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        }
        .brand-content { position: relative; z-index: 1; }
        .brand-logo {
          width: 72px; height: 72px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center;
          color: white; margin-bottom: 24px;
        }
        .brand-content h1 { color: white; font-size: 2.5rem; margin-bottom: 8px; font-weight: 800; }
        .tagline { color: rgba(255,255,255,0.95); font-size: 1.25rem; margin-bottom: 20px; font-weight: 500; }
        .description { color: rgba(255,255,255,0.85); margin-bottom: 32px; line-height: 1.7; font-size: 0.9375rem; }
        .tamil-tagline { 
          font-size: 1rem; 
          color: rgba(255,255,255,0.9); 
          font-style: italic; 
          margin-bottom: 16px; 
          padding: 8px 16px;
          background: rgba(255,255,255,0.15);
          border-radius: var(--radius-md);
          display: inline-block;
        }
        
        .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px; }
        .feature-item { 
          display: flex; align-items: center; gap: 10px; 
          color: white; font-size: 0.875rem; font-weight: 500;
          background: rgba(255,255,255,0.1); padding: 12px 14px;
          border-radius: var(--radius-lg);
        }
        
        .trust-badges { display: flex; gap: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.2); }
        .badge-item { display: flex; flex-direction: column; }
        .badge-number { color: white; font-size: 1.5rem; font-weight: 800; }
        .badge-text { color: rgba(255,255,255,0.7); font-size: 0.75rem; }
        
        .login-form-section { padding: 48px; display: flex; align-items: center; }
        .form-container { width: 100%; max-width: 360px; margin: 0 auto; }
        .form-container h2 { font-size: 1.75rem; margin-bottom: 8px; text-align: center; }
        .form-subtitle { color: var(--text-secondary); margin-bottom: 28px; text-align: center; }
        .input-icon { position: relative; }
        .input-icon svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-tertiary); }
        .input-icon input { padding-left: 44px; }
        .w-full { width: 100%; }
        .error-alert { 
          background: rgba(239, 68, 68, 0.1); color: #ef4444; 
          padding: 12px 16px; border-radius: var(--radius-md); 
          margin-bottom: 20px; font-size: 0.875rem; text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; color: var(--text-tertiary); font-size: 0.8125rem; }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border-subtle); }
        
        .btn-demo {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          transition: all var(--transition-fast);
        }
        .btn-demo:hover {
          background: var(--bg-card);
          border-color: var(--primary-400);
          color: var(--primary-400);
        }
        
        .switch-mode { text-align: center; margin-top: 24px; color: var(--text-secondary); font-size: 0.9375rem; }
        .switch-mode button { background: none; border: none; color: var(--primary-400); cursor: pointer; font-weight: 600; }
        .terms-text { text-align: center; margin-top: 20px; font-size: 0.75rem; color: var(--text-tertiary); }
        
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    )
}
