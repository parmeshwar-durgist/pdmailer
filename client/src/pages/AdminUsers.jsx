import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Mail, 
  Send, 
  Trash2, 
  Search, 
  RefreshCw, 
  Shield, 
  UserCheck, 
  AlertCircle,
  FileSpreadsheet,
  Eye,
  EyeOff,
  Clock,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Calendar,
  X,
  ListFilter,
  KeyRound,
  Copy,
  Check,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/common/ConfirmModal';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';
import StatusBadge from '../components/common/StatusBadge';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Deletion modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null,
    loading: false
  });

  // User details & audit logs modal state
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    loading: false,
    activeTab: 'overview', // 'overview' | 'campaigns' | 'logs'
    data: null
  });

  // User credentials (username & password) modal state
  const [credModal, setCredModal] = useState({
    isOpen: false,
    loading: false,
    user: null,
    creds: null,
    showPassword: false,
    copiedField: null,
    newPassword: '',
    resetting: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats')
      ]);
      setUsers(usersRes.data.data || []);
      setStats(statsRes.data.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load admin user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openUserDetails = async (user) => {
    setDetailsModal({
      isOpen: true,
      loading: true,
      activeTab: 'overview',
      data: null
    });

    try {
      const res = await api.get(`/admin/users/${user.id}`);
      setDetailsModal({
        isOpen: true,
        loading: false,
        activeTab: 'overview',
        data: res.data.data
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load user details and logs');
      setDetailsModal(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const openLoginCredentials = async (user) => {
    setCredModal({
      isOpen: true,
      loading: true,
      user,
      creds: null,
      showPassword: false,
      copiedField: null,
      newPassword: '',
      resetting: false
    });

    try {
      const res = await api.get(`/admin/users/${user.id}/credentials`);
      setCredModal(prev => ({
        ...prev,
        loading: false,
        creds: res.data.data
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch user credentials');
      setCredModal(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCredModal(prev => ({ ...prev, copiedField: fieldName }));
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => {
      setCredModal(prev => ({ ...prev, copiedField: null }));
    }, 2500);
  };

  const handleAdminPasswordReset = async (e) => {
    e.preventDefault();
    if (!credModal.newPassword || credModal.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setCredModal(prev => ({ ...prev, resetting: true }));
    try {
      const res = await api.post(`/admin/users/${credModal.user.id}/reset-password`, {
        newPassword: credModal.newPassword
      });
      toast.success(res.data.message || 'Password successfully updated!');
      setCredModal(prev => ({
        ...prev,
        resetting: false,
        creds: {
          ...prev.creds,
          password: prev.newPassword
        },
        newPassword: '',
        showPassword: true
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user password');
      setCredModal(prev => ({ ...prev, resetting: false }));
    }
  };

  const handleDeleteUser = (u) => {
    if (u.id === currentUser?.id) {
      toast.error('You cannot delete your own administrator account.');
      return;
    }
    setDeleteModal({
      isOpen: true,
      user: u,
      loading: false
    });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;
    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      const res = await api.delete(`/admin/users/${deleteModal.user.id}`);
      toast.success(res.data.message || 'User permanently deleted');
      setUsers(prev => prev.filter(u => u.id !== deleteModal.user.id));
      setDeleteModal({ isOpen: false, user: null, loading: false });
      
      // If modals were open for this user, close them
      if (detailsModal.data?.user?.id === deleteModal.user.id) {
        setDetailsModal({ isOpen: false, loading: false, activeTab: 'overview', data: null });
      }
      if (credModal.user?.id === deleteModal.user.id) {
        setCredModal({ isOpen: false, loading: false, user: null, creds: null });
      }

      // Refresh platform stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()));

    const matchesRole =
      roleFilter === 'all' ? true : u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="container-fluid p-0">
      {/* Page Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="badge px-2 py-1 rounded-pill"
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.12)',
                color: '#7c3aed',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <ShieldCheck size={13} className="me-1" /> Administrator Console
            </span>
          </div>
          <h4 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
            User Management, Login Details & Logs
          </h4>
          <p className="text-muted small mb-0">
            Monitor registered users, inspect credentials, view login history, and review private SMTP and email dispatch logs.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 align-self-start align-self-sm-auto rounded-3"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Platform Overview KPIs */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Total Platform Users"
              value={stats.total_users || 0}
              icon={Users}
              variant="primary"
              subtitle={`${stats.total_admins || 0} Admins · ${stats.total_standard_users || 0} Standard Users`}
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Total System Contacts"
              value={stats.total_contacts || 0}
              icon={FileSpreadsheet}
              variant="success"
              subtitle="Aggregated across all users"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Total Platform Campaigns"
              value={stats.total_campaigns || 0}
              icon={Mail}
              variant="warning"
              subtitle="Created across all workspaces"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              title="Total Emails Dispatched"
              value={stats.total_sent_emails || 0}
              icon={Send}
              variant="info"
              subtitle={`${stats.total_failed_emails || 0} failed attempts`}
            />
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        {/* Controls Bar */}
        <div className="p-3 border-bottom bg-light bg-opacity-50">
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0">
                  <Search size={15} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by user name or email address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-12 col-md-4 col-lg-3">
              <select
                className="form-select form-select-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles (Admins & Users)</option>
                <option value="admin">Administrators Only</option>
                <option value="user">Standard Users Only</option>
              </select>
            </div>

            <div className="col-12 col-md-2 col-lg-4 text-md-end text-muted small">
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small">
              <tr>
                <th style={{ width: 45 }}>ID</th>
                <th>User Details</th>
                <th>Role</th>
                <th>Last Login</th>
                <th className="text-center">SMTP Status</th>
                <th className="text-center">Contacts</th>
                <th className="text-center">Emails Sent</th>
                <th className="text-end pe-3" style={{ minWidth: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    <span className="text-muted small">Loading user logs & directory...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-5 text-center">
                    <EmptyState
                      icon={Users}
                      title="No Users Found"
                      message={search ? 'No users matched your search criteria.' : 'No users currently registered.'}
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isAdminRole = u.role === 'admin';

                  return (
                    <tr key={u.id}>
                      <td className="text-muted small fw-semibold">#{u.id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0"
                            style={{
                              width: 36,
                              height: 36,
                              background: isAdminRole
                                ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                              fontSize: '0.85rem'
                            }}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="overflow-hidden">
                            <div className="fw-semibold text-dark text-truncate d-flex align-items-center gap-1">
                              {u.name}
                              {isCurrent && (
                                <span className="badge bg-secondary-subtle text-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-muted small text-truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isAdminRole ? (
                          <span
                            className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill"
                            style={{
                              backgroundColor: 'rgba(124, 58, 237, 0.12)',
                              color: '#7c3aed',
                              fontSize: '0.725rem',
                              fontWeight: 700
                            }}
                          >
                            <Shield size={11} /> Admin
                          </span>
                        ) : (
                          <span
                            className="badge d-inline-flex align-items-center gap-1 px-2.5 py-1 rounded-pill"
                            style={{
                              backgroundColor: 'rgba(37, 99, 235, 0.1)',
                              color: '#2563eb',
                              fontSize: '0.725rem',
                              fontWeight: 600
                            }}
                          >
                            <UserCheck size={11} /> User
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="small">
                          <div className="d-flex align-items-center gap-1 text-dark fw-medium">
                            <Clock size={12} className="text-muted" />
                            {formatDateTime(u.last_login_at)}
                          </div>
                          {u.last_login_ip && (
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              IP: {u.last_login_ip}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-center">
                        {u.has_smtp ? (
                          <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill small">
                            <CheckCircle2 size={12} className="me-1" /> Active
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border px-2 py-1 rounded-pill small">
                            <XCircle size={12} className="me-1" /> Not Configured
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-light text-dark border px-2 py-1 rounded-pill">
                          {u.total_contacts || 0}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill">
                          {u.total_sent_emails || 0}
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-1 flex-wrap">
                          {/* 🔑 BUTTON 1: LOGIN DETAILS (Username & Password Show) */}
                          <button
                            className="btn btn-sm btn-outline-dark rounded-3 d-inline-flex align-items-center gap-1 px-2 py-1"
                            title="View user login username and password"
                            onClick={() => openLoginCredentials(u)}
                            style={{ fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            <KeyRound size={13} className="text-warning" />
                            <span>Login Details</span>
                          </button>

                          {/* 📊 BUTTON 2: DETAILS & LOGS */}
                          <button
                            className="btn btn-sm btn-primary rounded-3 d-inline-flex align-items-center gap-1 px-2 py-1"
                            title="View all details, configuration & logs"
                            onClick={() => openUserDetails(u)}
                            style={{ fontSize: '0.75rem' }}
                          >
                            <Eye size={13} />
                            <span>Details & Logs</span>
                          </button>

                          {/* 🗑️ BUTTON 3: DELETE USER */}
                          <button
                            className="btn btn-sm btn-outline-danger rounded-3 p-1.5"
                            title={isCurrent ? 'You cannot delete yourself' : 'Delete user account'}
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 🔑 USER LOGIN DETAILS & CREDENTIALS MODAL                     */}
      {/* ============================================================== */}
      {credModal.isOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 520 }}>
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header border-bottom px-4 py-3 bg-dark text-white">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center text-warning"
                    style={{ width: 36, height: 36, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    <KeyRound size={18} />
                  </div>
                  <div>
                    <h6 className="modal-title fw-bold mb-0 text-white">User Login Details</h6>
                    <small style={{ color: '#94a3b8' }}>Account username & password credentials</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCredModal(prev => ({ ...prev, isOpen: false, creds: null }))}
                />
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-light bg-opacity-50">
                {credModal.loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary mb-2" role="status" />
                    <div className="text-muted small">Retrieving user credentials...</div>
                  </div>
                ) : !credModal.creds ? (
                  <EmptyState title="Not Available" message="Could not retrieve credentials for this user." />
                ) : (
                  <div>
                    {/* User Profile Summary */}
                    <div className="p-3 bg-white rounded-3 border mb-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                          style={{
                            width: 36,
                            height: 36,
                            background: credModal.creds.role === 'admin' ? '#7c3aed' : '#2563eb',
                            fontSize: '0.85rem'
                          }}
                        >
                          {credModal.creds.name ? credModal.creds.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{credModal.creds.name}</div>
                          <div className="text-muted small">User ID: #{credModal.creds.id}</div>
                        </div>
                      </div>

                      <span
                        className="badge rounded-pill"
                        style={{
                          fontSize: '0.725rem',
                          backgroundColor: credModal.creds.role === 'admin' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(37, 99, 235, 0.12)',
                          color: credModal.creds.role === 'admin' ? '#7c3aed' : '#2563eb'
                        }}
                      >
                        {credModal.creds.role === 'admin' ? 'Administrator' : 'Standard User'}
                      </span>
                    </div>

                    {/* 1. Username / Login Email Box */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary text-uppercase mb-1">
                        Login Username / Email
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 text-muted">
                          <Users size={16} />
                        </span>
                        <input
                          type="text"
                          readOnly
                          className="form-control bg-white font-monospace fw-semibold text-dark"
                          value={credModal.creds.email}
                          style={{ fontSize: '0.9rem' }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3"
                          onClick={() => copyToClipboard(credModal.creds.email, 'Username')}
                          title="Copy username to clipboard"
                        >
                          {credModal.copiedField === 'Username' ? (
                            <>
                              <Check size={14} className="text-success" />
                              <span className="text-success small fw-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span className="small">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* 2. Password Box */}
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-secondary text-uppercase mb-1">
                        Password
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 text-muted">
                          <Lock size={16} />
                        </span>
                        <input
                          type={credModal.showPassword ? 'text' : 'password'}
                          readOnly
                          className="form-control bg-white font-monospace fw-bold text-dark"
                          value={credModal.creds.password}
                          style={{ fontSize: '0.95rem', letterSpacing: credModal.showPassword ? 'normal' : '0.15em' }}
                        />
                        {/* Toggle visibility */}
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-2.5"
                          onClick={() => setCredModal(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                          title={credModal.showPassword ? 'Hide password' : 'Show password'}
                        >
                          {credModal.showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        {/* Copy password */}
                        <button
                          type="button"
                          className="btn btn-outline-secondary d-flex align-items-center gap-1 px-3"
                          onClick={() => copyToClipboard(credModal.creds.password, 'Password')}
                          title="Copy password to clipboard"
                        >
                          {credModal.copiedField === 'Password' ? (
                            <>
                              <Check size={14} className="text-success" />
                              <span className="text-success small fw-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span className="small">Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <small className="text-muted mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                        Click the eye icon to reveal the plaintext password, or click Copy to paste into login forms.
                      </small>
                    </div>

                    {/* 3. Quick Change / Reset Password Section */}
                    <div className="border-top pt-3 mt-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="small fw-bold text-secondary text-uppercase">
                          Change or Reset Password
                        </span>
                      </div>
                      <form onSubmit={handleAdminPasswordReset} className="input-group input-group-sm">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter new password (min 6 chars)..."
                          value={credModal.newPassword}
                          onChange={(e) => setCredModal(prev => ({ ...prev, newPassword: e.target.value }))}
                        />
                        <button
                          type="submit"
                          className="btn btn-primary px-3 fw-semibold"
                          disabled={credModal.resetting || !credModal.newPassword}
                        >
                          {credModal.resetting ? 'Saving...' : 'Set Password'}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top px-4 py-2 bg-light d-flex justify-content-between">
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  🔒 Admin Security Clearance Only
                </small>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-4 rounded-3"
                  onClick={() => setCredModal(prev => ({ ...prev, isOpen: false, creds: null }))}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📊 USER COMPLETE DETAILS & AUDIT LOGS MODAL                   */}
      {/* ============================================================== */}
      {detailsModal.isOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(3px)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header border-bottom px-4 py-3 bg-light">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                    style={{
                      width: 44,
                      height: 44,
                      background: detailsModal.data?.user?.role === 'admin'
                        ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
                        : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      fontSize: '1.1rem'
                    }}
                  >
                    {detailsModal.data?.user?.name ? detailsModal.data.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      {detailsModal.data?.user?.name || 'User Details'}
                      <span
                        className="badge rounded-pill"
                        style={{
                          fontSize: '0.7rem',
                          backgroundColor: detailsModal.data?.user?.role === 'admin' ? 'rgba(124, 58, 237, 0.15)' : 'rgba(37, 99, 235, 0.15)',
                          color: detailsModal.data?.user?.role === 'admin' ? '#7c3aed' : '#2563eb'
                        }}
                      >
                        {detailsModal.data?.user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                      </span>
                    </h5>
                    <div className="text-muted small">
                      {detailsModal.data?.user?.email} · User ID: #{detailsModal.data?.user?.id}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {detailsModal.data?.user && (
                    <button
                      className="btn btn-sm btn-outline-dark d-flex align-items-center gap-1 rounded-3 px-2.5 py-1"
                      onClick={() => openLoginCredentials(detailsModal.data.user)}
                    >
                      <KeyRound size={13} className="text-warning" />
                      <span>View Login Details</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDetailsModal({ isOpen: false, loading: false, activeTab: 'overview', data: null })}
                  />
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="px-4 pt-3 border-bottom bg-white">
                <ul className="nav nav-tabs border-0 gap-2">
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 pb-2 px-3 fw-semibold ${detailsModal.activeTab === 'overview' ? 'active border-bottom border-primary border-3 text-primary' : 'text-muted'}`}
                      onClick={() => setDetailsModal(prev => ({ ...prev, activeTab: 'overview' }))}
                    >
                      <Globe size={15} className="me-1.5" /> Overview & Profile
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 pb-2 px-3 fw-semibold ${detailsModal.activeTab === 'campaigns' ? 'active border-bottom border-primary border-3 text-primary' : 'text-muted'}`}
                      onClick={() => setDetailsModal(prev => ({ ...prev, activeTab: 'campaigns' }))}
                    >
                      <Mail size={15} className="me-1.5" /> Campaign History ({detailsModal.data?.campaigns?.length || 0})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link border-0 pb-2 px-3 fw-semibold ${detailsModal.activeTab === 'logs' ? 'active border-bottom border-primary border-3 text-primary' : 'text-muted'}`}
                      onClick={() => setDetailsModal(prev => ({ ...prev, activeTab: 'logs' }))}
                    >
                      <ListFilter size={15} className="me-1.5" /> Recent Email Dispatch Logs ({detailsModal.data?.recentLogs?.length || 0})
                    </button>
                  </li>
                </ul>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 bg-light bg-opacity-25">
                {detailsModal.loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-2" role="status" />
                    <div className="text-muted small">Fetching complete user audit logs...</div>
                  </div>
                ) : !detailsModal.data ? (
                  <EmptyState title="User Not Found" message="Could not retrieve information for this user." />
                ) : (
                  <>
                    {/* TAB 1: OVERVIEW & PROFILE */}
                    {detailsModal.activeTab === 'overview' && (
                      <div className="row g-3">
                        {/* Summary Metrics */}
                        <div className="col-12">
                          <div className="row g-2">
                            <div className="col-6 col-md-3">
                              <div className="p-3 bg-white rounded-3 border text-center">
                                <div className="text-muted small mb-1">Total Contacts</div>
                                <div className="h4 fw-bold mb-0 text-dark">{detailsModal.data.user.total_contacts || 0}</div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3">
                              <div className="p-3 bg-white rounded-3 border text-center">
                                <div className="text-muted small mb-1">Campaigns</div>
                                <div className="h4 fw-bold mb-0 text-primary">{detailsModal.data.user.total_campaigns || 0}</div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3">
                              <div className="p-3 bg-white rounded-3 border text-center">
                                <div className="text-muted small mb-1">Emails Sent</div>
                                <div className="h4 fw-bold mb-0 text-success">{detailsModal.data.user.total_sent_emails || 0}</div>
                              </div>
                            </div>
                            <div className="col-6 col-md-3">
                              <div className="p-3 bg-white rounded-3 border text-center">
                                <div className="text-muted small mb-1">Emails Failed</div>
                                <div className="h4 fw-bold mb-0 text-danger">{detailsModal.data.user.total_failed_emails || 0}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Login & Security Card */}
                        <div className="col-12 col-md-6">
                          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
                            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                              <Clock size={16} className="text-primary" /> Login & Authentication Details
                            </h6>
                            <div className="list-group list-group-flush small">
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Account Created:</span>
                                <span className="fw-semibold text-dark">{formatDateTime(detailsModal.data.user.created_at)}</span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Last Login Timestamp:</span>
                                <span className="fw-semibold text-dark">{formatDateTime(detailsModal.data.user.last_login_at)}</span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Last Known IP Address:</span>
                                <span className="badge bg-light text-dark border">{detailsModal.data.user.last_login_ip || 'Not recorded'}</span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Account Role:</span>
                                <span className="fw-bold text-uppercase">{detailsModal.data.user.role}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SMTP & Sender Configuration Card */}
                        <div className="col-12 col-md-6">
                          <div className="card h-100 border-0 shadow-sm rounded-3 p-3 bg-white">
                            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                              <Mail size={16} className="text-success" /> Private SMTP & Sending Profile
                            </h6>
                            <div className="list-group list-group-flush small">
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Sender Name:</span>
                                <span className="fw-semibold text-dark">{detailsModal.data.user.sender_name || 'Not set'}</span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Sender Email:</span>
                                <span className="fw-semibold text-dark">{detailsModal.data.user.sender_email || 'Not set'}</span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Gmail App Password:</span>
                                <span>
                                  {detailsModal.data.user.has_smtp ? (
                                    <span className="badge bg-success-subtle text-success">Configured & Stored</span>
                                  ) : (
                                    <span className="badge bg-warning-subtle text-warning">Missing / Not configured</span>
                                  )}
                                </span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Sending Throttling:</span>
                                <span className="fw-semibold text-dark">{detailsModal.data.user.send_delay_seconds || 2} seconds delay</span>
                              </div>
                              <div className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Active PDF Resume:</span>
                                <span className="fw-semibold text-truncate" style={{ maxWidth: 200 }}>
                                  {detailsModal.data.user.active_resume || 'None uploaded'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Portfolio & Online Profiles */}
                        <div className="col-12">
                          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                            <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                              <Globe size={16} className="text-info" /> Portfolio & Links
                            </h6>
                            <div className="row g-2 small">
                              <div className="col-12 col-md-6">
                                <div className="p-2 border rounded-2 bg-light">
                                  <div className="text-muted mb-1">Portfolio Website:</div>
                                  {detailsModal.data.user.portfolio_url ? (
                                    <a
                                      href={detailsModal.data.user.portfolio_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1 text-truncate"
                                    >
                                      {detailsModal.data.user.portfolio_url} <ExternalLink size={12} />
                                    </a>
                                  ) : (
                                    <span className="text-muted fst-italic">Not provided</span>
                                  )}
                                </div>
                              </div>
                              <div className="col-12 col-md-6">
                                <div className="p-2 border rounded-2 bg-light">
                                  <div className="text-muted mb-1">GitHub Profile:</div>
                                  {detailsModal.data.user.github_url ? (
                                    <a
                                      href={detailsModal.data.user.github_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-primary text-decoration-none fw-semibold d-flex align-items-center gap-1 text-truncate"
                                    >
                                      {detailsModal.data.user.github_url} <ExternalLink size={12} />
                                    </a>
                                  ) : (
                                    <span className="text-muted fst-italic">Not provided</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: CAMPAIGN HISTORY */}
                    {detailsModal.activeTab === 'campaigns' && (
                      <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0 small">
                            <thead className="table-light">
                              <tr>
                                <th>Campaign Name</th>
                                <th>Status</th>
                                <th className="text-center">Recipients</th>
                                <th className="text-center">Sent</th>
                                <th className="text-center">Failed</th>
                                <th>Created At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!detailsModal.data.campaigns || detailsModal.data.campaigns.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">
                                    This user has not created any email campaigns yet.
                                  </td>
                                </tr>
                              ) : (
                                detailsModal.data.campaigns.map((camp) => (
                                  <tr key={camp.id}>
                                    <td className="fw-semibold text-dark">{camp.campaign_name}</td>
                                    <td>
                                      <StatusBadge status={camp.status} />
                                    </td>
                                    <td className="text-center fw-medium">{camp.total_recipients || 0}</td>
                                    <td className="text-center text-success fw-bold">{camp.sent_count || 0}</td>
                                    <td className="text-center text-danger fw-bold">{camp.failed_count || 0}</td>
                                    <td className="text-muted">{formatDateTime(camp.created_at)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: EMAIL DISPATCH LOGS */}
                    {detailsModal.activeTab === 'logs' && (
                      <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white">
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0 small">
                            <thead className="table-light">
                              <tr>
                                <th>Recipient</th>
                                <th>Company</th>
                                <th>Campaign / Subject</th>
                                <th>Status</th>
                                <th>Sent Time</th>
                                <th>Error Diagnostics</th>
                              </tr>
                            </thead>
                            <tbody>
                              {!detailsModal.data.recentLogs || detailsModal.data.recentLogs.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="text-center py-4 text-muted">
                                    No email dispatch logs recorded for this user yet.
                                  </td>
                                </tr>
                              ) : (
                                detailsModal.data.recentLogs.map((log) => (
                                  <tr key={log.id}>
                                    <td>
                                      <div className="fw-semibold text-dark">{log.recipient_name}</div>
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{log.recipient_email}</div>
                                    </td>
                                    <td>{log.recipient_company || '—'}</td>
                                    <td>
                                      <div className="fw-medium text-dark text-truncate" style={{ maxWidth: 220 }}>
                                        {log.rendered_subject}
                                      </div>
                                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                        Campaign: {log.campaign_name}
                                      </div>
                                    </td>
                                    <td>
                                      <StatusBadge status={log.status} />
                                    </td>
                                    <td className="text-muted">{formatDateTime(log.sent_at || log.created_at)}</td>
                                    <td>
                                      {log.last_error ? (
                                        <span className="text-danger small" title={log.last_error}>
                                          {log.last_error.length > 45 ? `${log.last_error.substring(0, 45)}...` : log.last_error}
                                        </span>
                                      ) : (
                                        <span className="text-success small">None (Delivered)</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-top px-4 py-2 bg-light">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-4 rounded-3"
                  onClick={() => setDetailsModal({ isOpen: false, loading: false, activeTab: 'overview', data: null })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Permanently Delete User Account?"
        message={`Are you sure you want to delete "${deleteModal.user?.name}" (${deleteModal.user?.email})? All their contacts, resumes, templates, campaigns, and logs will be permanently erased.`}
        confirmText="Delete User"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteModal({ isOpen: false, user: null, loading: false })}
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default AdminUsers;
