import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  LogIn, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      toast.success('Signed in successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid email or password. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row bg-white">
      {/* Left Showcase Panel: ONLY visible on desktop (d-none d-lg-flex) */}
      <div
        className="d-none d-lg-flex col-lg-6 flex-column justify-content-between p-5 text-white position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #090e1a 0%, #0f172a 50%, #1e293b 100%)',
          minHeight: '100vh'
        }}
      >
        {/* Ambient Glow Effects */}
        <div
          className="position-absolute rounded-circle"
          style={{
            top: '-10%',
            left: '-10%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          className="position-absolute rounded-circle"
          style={{
            bottom: '-10%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Brand Header */}
        <div className="position-relative" style={{ zIndex: 2 }}>
          <div className="d-flex align-items-center gap-2 mb-4">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow"
              style={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                fontSize: '1.15rem',
                fontWeight: 800
              }}
            >
              HR
            </div>
            <div>
              <h5 className="mb-0 fw-bold text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                HR Bulk Email Sender
              </h5>
              <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Enterprise Outreach & Dispatch Portal
              </small>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 mb-3 fw-semibold d-inline-flex align-items-center gap-1">
              <Sparkles size={14} /> Production Job Application Suite
            </span>
            <h2 className="display-6 fw-extrabold text-white mb-3" style={{ lineHeight: 1.25 }}>
              Accelerate your engineering recruitment outreach.
            </h2>
            <p className="lead fs-6 mb-4" style={{ color: '#94a3b8', maxWidth: '480px' }}>
              Import IT company HR contacts, personalize dynamic email messages with custom placeholders, attach your resume PDF, and dispatch 1:1 securely via Gmail SMTP.
            </p>

            {/* Feature Bullets */}
            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3 bg-white bg-opacity-10 text-primary flex-shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white small">Bulk Excel & CSV Import</h6>
                  <small style={{ color: '#94a3b8' }}>Preview, deduplicate, and validate 100+ HR contacts effortlessly.</small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3 bg-white bg-opacity-10 text-success flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white small">Automated PDF Resume Attachment</h6>
                  <small style={{ color: '#94a3b8' }}>Secure storage with automatic attachment to individual emails.</small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3 bg-white bg-opacity-10 text-warning flex-shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white small">Throttled Gmail SMTP Queue</h6>
                  <small style={{ color: '#94a3b8' }}>Sequential delays, crash recovery, and zero BCC leakage.</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="position-relative pt-3 border-top border-white border-opacity-10" style={{ zIndex: 2 }}>
          <small style={{ color: '#64748b' }}>
            © {new Date().getFullYear()} HR Bulk Email Sender Portal. All rights reserved.
          </small>
        </div>
      </div>

      {/* Right / Mobile Authentication Form Panel */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5 bg-white min-vh-100">
        <div style={{ maxWidth: '420px', width: '100%' }}>
          
          {/* Mobile-Only Header Brand Bar */}
          <div className="d-lg-none text-center mb-4 pt-2">
            <div
              className="d-inline-flex align-items-center justify-content-center text-white rounded-3 shadow mb-2"
              style={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                fontSize: '1.25rem',
                fontWeight: 800
              }}
            >
              HR
            </div>
            <h4 className="fw-extrabold text-dark mb-0" style={{ letterSpacing: '-0.02em' }}>
              HR Bulk Email Sender
            </h4>
            <small className="text-muted">Job Application Portal</small>
          </div>

          <div className="mb-4 text-center text-lg-start">
            <h3 className="fw-extrabold text-dark mb-1" style={{ letterSpacing: '-0.025em' }}>
              Sign In
            </h3>
            <p className="text-muted small mb-0">
              Enter your administrator credentials to access the portal.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 rounded-3 mb-3 border-0 shadow-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control bg-light border-start-0 ps-1"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control bg-light border-start-0 border-end-0 ps-1"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-light border-start-0 text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label small text-muted user-select-none" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2 shadow-sm"
              style={{ height: '48px', fontSize: '0.95rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Link to Register */}
          <div className="text-center mt-4">
            <span className="small text-muted">Don't have an account? </span>
            <Link to="/register" className="small fw-semibold text-primary text-decoration-none">
              Create Account
            </Link>
          </div>

          {/* Security footnote */}
          <div className="mt-4 pt-3 border-top text-center text-muted small">
            <span className="d-inline-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={14} className="text-success" />
              Secured with bcrypt password hashing & JWT session auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
