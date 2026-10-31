import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  Send, 
  History, 
  ListFilter, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import SmtpSetupModal from '../components/common/SmtpSetupModal';

const DashboardLayout = () => {
  const { user, logout, isAdmin, smtpStatus, isSmtpReady } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Auto-close sidebar on navigation in mobile view
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // All navigation items are always available so users can manage contacts, templates, resumes, and WhatsApp
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'HR Contacts', path: '/contacts', icon: Users },
    { label: 'Import Excel/CSV', path: '/import', icon: FileSpreadsheet },
    { label: 'Resume Manager', path: '/resumes', icon: FileText },
    { label: 'Email Templates', path: '/templates', icon: Mail },
    { label: 'Create Campaign', path: '/campaigns/new', icon: Send },
    { label: 'Campaign History', path: '/campaigns', icon: History },
    { label: 'Recipient Logs', path: '/logs', icon: ListFilter },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  if (isAdmin) {
    navItems.push({
      label: 'User Management',
      path: '/admin/users',
      icon: ShieldCheck,
      badge: 'Admin'
    });
  }

  return (
    <div className="d-flex min-vh-100">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{
            backgroundColor: 'rgba(9, 14, 26, 0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 1040,
            transition: 'opacity 0.25s ease'
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar Navigation Drawer */}
      <aside className={`sidebar d-flex flex-column p-3 ${sidebarOpen ? 'show' : ''}`}>
        {/* Brand Header */}
        <div className="d-flex align-items-center justify-content-between mb-4 px-2 pt-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow"
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                fontSize: '1.05rem',
                fontWeight: 800
              }}
            >
              HR
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-white d-flex align-items-center gap-1" style={{ fontSize: '1rem', letterSpacing: '-0.02em' }}>
                HR Mailer <Sparkles size={14} className="text-warning" />
              </h6>
              <small style={{ color: '#94a3b8', fontSize: '0.725rem' }}>
                Job Application Portal
              </small>
            </div>
          </div>
          <button
            className="btn btn-sm text-light d-lg-none p-1 border-0"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* User Card in Mobile Sidebar Header */}
        <div className="d-lg-none mb-3 p-2.5 rounded-3 border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
              style={{ 
                width: 32, 
                height: 32, 
                background: isAdmin ? '#7c3aed' : '#3b82f6', 
                fontSize: '0.8rem' 
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden flex-grow-1">
              <div className="text-white text-truncate fw-semibold small d-flex align-items-center justify-content-between">
                <span>{user?.name || 'Administrator'}</span>
                <span 
                  className="badge rounded-pill" 
                  style={{ 
                    fontSize: '0.65rem', 
                    backgroundColor: isAdmin ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)', 
                    color: isAdmin ? '#c084fc' : '#93c5fd' 
                  }}
                >
                  {isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="text-truncate text-muted" style={{ fontSize: '0.7rem' }}>{user?.email || 'admin@hrmailer.com'}</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="nav flex-column flex-grow-1 overflow-y-auto pe-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={item.path === '/dashboard' || item.path === '/campaigns'}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className="text-truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Footer Sign Out */}
        <div className="pt-3 border-top d-none d-lg-block" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="d-flex align-items-center gap-2 px-2 mb-3">
            <div
              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{
                width: 36,
                height: 36,
                background: isAdmin 
                  ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' 
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                fontSize: '0.85rem'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden flex-grow-1">
              <div className="text-white text-truncate fw-semibold d-flex align-items-center justify-content-between" style={{ fontSize: '0.875rem' }}>
                <span>{user?.name || 'Administrator'}</span>
                <span 
                  className="badge rounded-pill ms-1" 
                  style={{ 
                    fontSize: '0.65rem', 
                    backgroundColor: isAdmin ? 'rgba(168, 85, 247, 0.25)' : 'rgba(59, 130, 246, 0.25)', 
                    color: isAdmin ? '#c084fc' : '#93c5fd' 
                  }}
                >
                  {isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
              <div className="text-truncate" style={{ color: '#94a3b8', fontSize: '0.725rem' }}>
                {user?.email || 'admin@hrmailer.com'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-2 fw-semibold border-0"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#f87171'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Mobile Sign Out Button */}
        <div className="d-lg-none pt-2 border-top" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={logout}
            className="btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2 rounded-3 py-2 fw-semibold border-0 text-danger"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content flex-grow-1">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="d-flex align-items-center gap-2 gap-sm-3">
            <button
              className="btn btn-light d-lg-none border p-2 rounded-3"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation"
            >
              <Menu size={18} />
            </button>
            <div className="d-flex align-items-center gap-2">
              <div className="fw-bold text-dark" style={{ fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                HR Bulk Mailer
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* SMTP Status Indicator */}
            {smtpStatus.connected ? (
              <span className="badge-status badge-sent shadow-sm" style={{ fontSize: '0.725rem' }}>
                <CheckCircle2 size={12} /> <span className="d-none d-sm-inline">SMTP</span> Active
              </span>
            ) : (
              <NavLink to="/settings" className="text-decoration-none">
                <span className="badge-status badge-pending shadow-sm" style={{ fontSize: '0.725rem' }}>
                  <AlertCircle size={12} /> Setup SMTP
                </span>
              </NavLink>
            )}

            {/* Mobile Header User Avatar */}
            <div
              className="d-lg-none rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
              style={{ width: 32, height: 32, fontSize: '0.8rem' }}
              title={user?.name || 'Administrator'}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="p-3 p-sm-4 flex-grow-1">
          {/* SMTP Setup Suggestion Alert Banner (Non-blocking) */}
          {!isSmtpReady && !smtpStatus.loading && (
            <div className="alert alert-warning border-0 rounded-4 shadow-sm p-3 mb-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
              <div className="d-flex align-items-center gap-2.5">
                <AlertCircle size={22} className="text-warning flex-shrink-0" />
                <div>
                  <div className="fw-bold text-dark small">Gmail SMTP App Password Recommended</div>
                  <div className="text-muted" style={{ fontSize: '0.775rem' }}>
                    Configure your 16-character Google App Password in Settings to dispatch bulk emails. HR Contacts, Excel Import, WhatsApp Outreach, Resumes & Templates are active and ready!
                  </div>
                </div>
              </div>
              <NavLink to="/settings" className="btn btn-warning btn-sm px-3 py-1.5 fw-bold rounded-pill text-dark text-nowrap align-self-start align-self-sm-auto">
                Configure in Settings &rarr;
              </NavLink>
            </div>
          )}

          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Docked to bottom on phones) */}
        <nav
          className="d-lg-none position-fixed bottom-0 start-0 w-100 bg-white border-top d-flex justify-content-around align-items-center py-2 px-1 shadow-lg"
          style={{
            zIndex: 1030,
            paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))'
          }}
        >
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center border-0 ${isActive ? 'text-primary fw-bold' : 'text-secondary'}`
            }
          >
            <LayoutDashboard size={20} />
            <span style={{ fontSize: '0.675rem', marginTop: 2 }}>Home</span>
          </NavLink>

          <NavLink
            to="/contacts"
            className={({ isActive }) =>
              `btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center border-0 ${isActive ? 'text-primary fw-bold' : 'text-secondary'}`
            }
          >
            <Users size={20} />
            <span style={{ fontSize: '0.675rem', marginTop: 2 }}>Contacts</span>
          </NavLink>

          {/* Floating Action Button (New Campaign) */}
          <NavLink
            to="/campaigns/new"
            className="btn btn-primary rounded-circle p-0 d-flex align-items-center justify-content-center shadow-lg"
            style={{ width: 46, height: 46, marginTop: -18, border: '3px solid #ffffff' }}
            title="Create Campaign"
          >
            <Send size={18} />
          </NavLink>

          <NavLink
            to="/campaigns"
            className={({ isActive }) =>
              `btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center border-0 ${isActive ? 'text-primary fw-bold' : 'text-secondary'}`
            }
          >
            <History size={20} />
            <span style={{ fontSize: '0.675rem', marginTop: 2 }}>History</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `btn btn-link text-decoration-none p-1 d-flex flex-column align-items-center border-0 ${isActive ? 'text-primary fw-bold' : 'text-secondary'}`
            }
          >
            <Settings size={20} />
            <span style={{ fontSize: '0.675rem', marginTop: 2 }}>Settings</span>
          </NavLink>
        </nav>

        {/* First-Time Setup Welcome Modal for Unconfigured Users */}
        <SmtpSetupModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
