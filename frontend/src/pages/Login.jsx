import { useState, useEffect } from 'react'
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

  // Clear any stale token on mount
  useEffect(() => {
    api.logout() // Clear any old session
  }, [])

  // Clear error when switching between login/register
  const toggleMode = () => {
    setError('')
    setIsLogin(!isLogin)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        // Login uses email (form.username contains the email)
        await api.login(form.email || form.username, form.password)
        const user = await api.getProfile()
        onLogin(user)
      } else {
        // Register expects full_name, not username
        await api.register({
          full_name: form.username, // This is their display name
          email: form.email,
          password: form.password,
          store_name: form.storeName,
        })
        // After registration, log in with email
        await api.login(form.email, form.password)
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
              {/* For Registration - Show Full Name first */}
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon">
                    <User size={18} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Your full name"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                      minLength={2}
                    />
                  </div>
                </div>
              )}

              {/* Email - Always shown */}
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

              {/* Store Name - Registration only */}
              {!isLogin && (
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
                      minLength={2}
                    />
                  </div>
                </div>
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
              <button onClick={toggleMode}>
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
        /* Login Page - Cross Platform Responsive */
        .login-page {
          min-height: 100vh;
          min-height: -webkit-fill-available; /* iOS Safari fix */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          padding: max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left));
          background: linear-gradient(135deg, var(--bg-primary) 0%, #1a1a2e 100%);
          box-sizing: border-box;
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
        
        /* Tablet and below - single column */
        @media (max-width: 900px) {
          .login-container { 
            grid-template-columns: 1fr;
            max-width: 480px;
            border-radius: var(--radius-xl);
          }
          .login-brand { display: none; }
        }
        
        /* Mobile specific */
        @media (max-width: 480px) {
          .login-page {
            padding: 12px;
            align-items: flex-start;
            padding-top: max(40px, env(safe-area-inset-top));
          }
          .login-container {
            border-radius: var(--radius-lg);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          }
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
        
        .brand-content { 
          position: relative; 
          z-index: 1; 
        }
        
        .brand-logo {
          width: 72px; 
          height: 72px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px); /* Safari */
          border-radius: var(--radius-xl);
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white; 
          margin-bottom: 24px;
        }
        
        .brand-content h1 { 
          color: white; 
          font-size: 2.5rem; 
          margin-bottom: 8px; 
          font-weight: 800;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        .tagline { 
          color: rgba(255,255,255,0.95); 
          font-size: 1.25rem; 
          margin-bottom: 20px; 
          font-weight: 500; 
        }
        
        .description { 
          color: rgba(255,255,255,0.85); 
          margin-bottom: 32px; 
          line-height: 1.7; 
          font-size: 0.9375rem; 
        }
        
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
        
        .features-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px; 
          margin-bottom: 32px; 
        }
        
        .feature-item { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          color: white; 
          font-size: 0.875rem; 
          font-weight: 500;
          background: rgba(255,255,255,0.1); 
          padding: 12px 14px;
          border-radius: var(--radius-lg);
        }
        
        .trust-badges { 
          display: flex; 
          gap: 24px; 
          padding-top: 24px; 
          border-top: 1px solid rgba(255,255,255,0.2); 
        }
        
        .badge-item { 
          display: flex; 
          flex-direction: column; 
        }
        
        .badge-number { 
          color: white; 
          font-size: 1.5rem; 
          font-weight: 800; 
        }
        
        .badge-text { 
          color: rgba(255,255,255,0.7); 
          font-size: 0.75rem; 
        }
        
        /* Form Section */
        .login-form-section { 
          padding: 48px; 
          display: flex; 
          align-items: center;
          justify-content: center;
        }
        
        @media (max-width: 768px) {
          .login-form-section {
            padding: 32px 24px;
          }
        }
        
        @media (max-width: 480px) {
          .login-form-section {
            padding: 24px 16px;
          }
        }
        
        .form-container { 
          width: 100%; 
          max-width: 360px; 
          margin: 0 auto; 
        }
        
        .form-container h2 { 
          font-size: 1.75rem; 
          margin-bottom: 8px; 
          text-align: center;
          -webkit-font-smoothing: antialiased;
        }
        
        @media (max-width: 480px) {
          .form-container h2 {
            font-size: 1.5rem;
          }
        }
        
        .form-subtitle { 
          color: var(--text-secondary); 
          margin-bottom: 28px; 
          text-align: center;
          font-size: 0.9375rem;
        }
        
        @media (max-width: 480px) {
          .form-subtitle {
            margin-bottom: 20px;
            font-size: 0.875rem;
          }
        }
        
        /* Input styling for touch devices */
        .input-icon { 
          position: relative; 
        }
        
        .input-icon svg { 
          position: absolute; 
          left: 14px; 
          top: 50%; 
          transform: translateY(-50%); 
          color: var(--text-tertiary);
          pointer-events: none;
        }
        
        .input-icon input { 
          padding-left: 44px;
          /* iOS Safari - prevent zoom on focus */
          font-size: 16px !important;
          /* Touch-friendly height */
          min-height: 48px;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .w-full { 
          width: 100%; 
        }
        
        /* Error Alert */
        .error-alert { 
          background: rgba(239, 68, 68, 0.1); 
          color: #ef4444; 
          padding: 12px 16px; 
          border-radius: var(--radius-md); 
          margin-bottom: 20px; 
          font-size: 0.875rem; 
          text-align: center;
          border: 1px solid rgba(239, 68, 68, 0.2);
          word-break: break-word;
        }
        
        .divider { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          margin: 24px 0; 
          color: var(--text-tertiary); 
          font-size: 0.8125rem; 
        }
        
        .divider::before, 
        .divider::after { 
          content: ''; 
          flex: 1; 
          height: 1px; 
          background: var(--border-subtle); 
        }
        
        /* Demo Button */
        .btn-demo {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          color: var(--text-primary);
          transition: all var(--transition-fast);
          min-height: 48px;
          -webkit-tap-highlight-color: transparent;
        }
        
        .btn-demo:hover {
          background: var(--bg-card);
          border-color: var(--primary-400);
          color: var(--primary-400);
        }
        
        .btn-demo:active {
          transform: scale(0.98);
        }
        
        .switch-mode { 
          text-align: center; 
          margin-top: 24px; 
          color: var(--text-secondary); 
          font-size: 0.9375rem; 
        }
        
        .switch-mode button { 
          background: none; 
          border: none; 
          color: var(--primary-400); 
          cursor: pointer; 
          font-weight: 600;
          padding: 4px 8px;
          -webkit-tap-highlight-color: transparent;
        }
        
        .terms-text { 
          text-align: center; 
          margin-top: 20px; 
          font-size: 0.75rem; 
          color: var(--text-tertiary);
          line-height: 1.5;
        }
        
        .spin { 
          animation: spin 1s linear infinite; 
        }
        
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        
        /* iOS specific fixes */
        @supports (-webkit-touch-callout: none) {
          .login-page {
            min-height: -webkit-fill-available;
          }
          
          .form-input {
            font-size: 16px !important; /* Prevent zoom */
          }
        }
        
        /* Android Chrome specific */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .form-container {
            -webkit-font-smoothing: subpixel-antialiased;
          }
        }
        
        /* High DPI screens */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .brand-logo {
            border: 0.5px solid rgba(255,255,255,0.1);
          }
        }
        
        /* Landscape mobile */
        @media (max-height: 600px) and (orientation: landscape) {
          .login-page {
            align-items: flex-start;
            padding-top: 20px;
          }
          
          .login-form-section {
            padding: 20px;
          }
          
          .form-container h2 {
            font-size: 1.25rem;
            margin-bottom: 4px;
          }
          
          .form-subtitle {
            margin-bottom: 12px;
          }
          
          .form-group {
            margin-bottom: 12px;
          }
        }
        
        /* Desktop hover states */
        @media (hover: hover) and (pointer: fine) {
          .btn:hover {
            transform: translateY(-2px);
          }
        }
        
        /* Touch devices - remove hover effects */
        @media (hover: none) and (pointer: coarse) {
          .btn:hover {
            transform: none;
          }
          
          .btn:active {
            transform: scale(0.98);
          }
        }
      `}</style>
    </div>
  )
}
