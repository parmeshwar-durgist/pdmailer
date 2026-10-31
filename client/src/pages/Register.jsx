import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      toast.success('Account created successfully! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column flex-lg-row bg-white">
      {/* Left Showcase Panel: ONLY visible on desktop */}
      <div
        className="d-none d-lg-flex col-lg-6 flex-column justify-content-between p-5 text-white position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #090e1a 0%, #0f172a 50%, #1e293b 100%)',
          minHeight: '100vh'
        }}
      >
        {/* Ambient Glow */}
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
                Multi-User Recruitment Platform
              </small>
            </div>
          </div>

          <div className="mt-5 pt-3">
            <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 mb-3 fw-semibold d-inline-flex align-items-center gap-1">
              <Sparkles size={14} /> Get Started in Under 2 Minutes
            </span>
            <h2 className="display-6 fw-extrabold text-white mb-3" style={{ lineHeight: 1.25 }}>
              Create your private recruiter outreach portal.
            </h2>
            <p className="lead fs-6 mb-4" style={{ color: '#94a3b8', maxWidth: '480px' }}>
              Each account has an isolated database workspace for contacts, templates, resumes, and individual Gmail SMTP dispatch.
            </p>

            <div className="d-flex flex-column gap-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3 bg-white bg-opacity-10 text-primary flex-shrink-0">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white small">Isolated Contact Lists</h6>
                  <small style={{ color: '#94a3b8' }}>Your uploaded Excel sheets and HR recruiters remain 100% private.</small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3 bg-white bg-opacity-10 text-success flex-shrink-0">
                  <FileText size={18} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white small">Dedicated Resume & Templates</h6>
                  <small style={{ color: '#94a3b8' }}>Upload your own PDF resume and save personalized outreach templates.</small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="p-2 rounded-3 bg-white bg-opacity-10 text-warning flex-shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-white small">Your Own Gmail Account</h6>
                  <small style={{ color: '#94a3b8' }}>Emails are sent directly from your personal Gmail address with rate limits.</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="position-relative pt-3 border-top border-white border-opacity-10" style={{ zIndex: 2 }}>
          <small style={{ color: '#64748b' }}>
            © {new Date().getFullYear()} HR Bulk Email Sender Portal. All rights reserved.
          </small>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center p-3 p-sm-4 p-md-5 bg-white min-vh-100">
        <div style={{ maxWidth: '420px', width: '100%' }}>
          
          {/* Mobile Header */}
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
            <small className="text-muted">Create New Account</small>
          </div>

          <div className="mb-4 text-center text-lg-start">
            <h3 className="fw-extrabold text-dark mb-1" style={{ letterSpacing: '-0.025em' }}>
              Create an Account
            </h3>
            <p className="text-muted small mb-0">
              Sign up to start sending bulk job application emails.
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
              <label className="form-label small fw-semibold text-secondary">Full Name *</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 ps-1"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Email Address *</label>
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
              <label className="form-label small fw-semibold text-secondary">Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control bg-light border-start-0 border-end-0 ps-1"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Confirm Password *</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control bg-light border-start-0 ps-1"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="text-center mt-4">
            <span className="small text-muted">Already have an account? </span>
            <Link to="/login" className="small fw-semibold text-primary text-decoration-none">
              Sign In
            </Link>
          </div>

          {/* Security footnote */}
          <div className="mt-4 pt-3 border-top text-center text-muted small">
            <span className="d-inline-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.75rem' }}>
              <ShieldCheck size={14} className="text-success" />
              Isolated workspace & bcrypt password encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

