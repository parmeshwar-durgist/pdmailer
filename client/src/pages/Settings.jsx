import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Mail, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  RefreshCw,
  ExternalLink,
  Smartphone,
  QrCode,
  MessageSquare,
  PowerOff
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { refreshSmtpStatus } = useAuth();
  const [settings, setSettings] = useState({
    sender_name: '',
    sender_email: '',
    send_delay_seconds: '2',
    batch_size: '5',
    max_retries: '2',
    smtpConfigured: false,
    smtpConnected: false,
    smtpMessage: ''
  });

  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // WhatsApp state
  const [whatsappStatus, setWhatsappStatus] = useState({
    connected: false,
    status: 'disconnected',
    phone: null,
    qrDataUrl: null
  });
  const [loadingWa, setLoadingWa] = useState(false);
  const waPollRef = useRef(null);

  // Suppressions
  const [suppressions, setSuppressions] = useState([]);
  const [newSuppressionEmail, setNewSuppressionEmail] = useState('');
  const [newSuppressionReason, setNewSuppressionReason] = useState('Recipient requested unsubscribe');
  const [addingSuppression, setAddingSuppression] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setSettings(res.data.data);
    } catch (err) {
      toast.error('Failed to load settings');
    }
  };

  const fetchWhatsappStatus = async () => {
    try {
      const res = await api.get('/whatsapp/session/status');
      setWhatsappStatus(res.data.data);
      return res.data.data;
    } catch (err) {
      // ignore
    }
  };

  const fetchSuppressions = async () => {
    try {
      const res = await api.get('/settings/suppressions');
      setSuppressions(res.data.data || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchSuppressions();
    fetchWhatsappStatus();

    return () => {
      if (waPollRef.current) clearInterval(waPollRef.current);
    };
  }, []);

  const handleInitWhatsapp = async () => {
    setLoadingWa(true);
    try {
      const res = await api.post('/whatsapp/session/init');
      setWhatsappStatus(prev => ({
        ...prev,
        status: res.data.data.status,
        qrDataUrl: res.data.data.qrDataUrl,
        phone: res.data.data.phone
      }));

      // Start polling for QR code updates and connection
      if (waPollRef.current) clearInterval(waPollRef.current);
      waPollRef.current = setInterval(async () => {
        const latest = await fetchWhatsappStatus();
        if (latest && latest.connected) {
          clearInterval(waPollRef.current);
          toast.success(`WhatsApp successfully connected as +${latest.phone}!`);
        }
      }, 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize WhatsApp session');
    } finally {
      setLoadingWa(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    setLoadingWa(true);
    if (waPollRef.current) clearInterval(waPollRef.current);
    try {
      await api.post('/whatsapp/session/disconnect');
      setWhatsappStatus({
        connected: false,
        status: 'disconnected',
        phone: null,
        qrDataUrl: null
      });
      toast.success('WhatsApp session logged out.');
    } catch (err) {
      toast.error('Failed to disconnect WhatsApp');
    } finally {
      setLoadingWa(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.put('/settings', {
        sender_name: settings.sender_name,
        sender_email: settings.sender_email,
        send_delay_seconds: settings.send_delay_seconds,
        batch_size: settings.batch_size,
        max_retries: settings.max_retries,
        gmail_app_password: gmailAppPassword || undefined
      });
      toast.success('Settings updated successfully!');
      setGmailAppPassword('');
      await fetchSettings();
      await refreshSmtpStatus();
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setTestResult(null);
    try {
      const res = await api.get('/email/health');
      setTestResult(res.data);
      if (res.data.success) {
        toast.success('SMTP verified! Gmail connection is active.');
      } else {
        toast.error(res.data.message || 'SMTP connection verification failed.');
      }
      await refreshSmtpStatus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setTestResult({ success: false, message: msg });
      toast.error(msg);
      await refreshSmtpStatus();
    } finally {
      setTestingSmtp(false);
      fetchSettings();
    }
  };

  const handleAddSuppression = async (e) => {
    e.preventDefault();
    if (!newSuppressionEmail.trim()) return;
    setAddingSuppression(true);
    try {
      await api.post('/settings/suppressions', {
        email: newSuppressionEmail.trim(),
        reason: newSuppressionReason
      });
      toast.success(`Suppressed "${newSuppressionEmail}".`);
      setNewSuppressionEmail('');
      fetchSuppressions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add suppression');
    } finally {
      setAddingSuppression(false);
    }
  };

  const handleRemoveSuppression = async (id) => {
    try {
      await api.delete(`/settings/suppressions/${id}`);
      toast.success('Email removed from suppression list.');
      fetchSuppressions();
    } catch (err) {
      toast.error('Failed to remove suppression');
    }
  };

  return (
    <div style={{ maxWidth: 960 }} className="mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Application & Email Settings</h4>
        <p className="text-muted small mb-0">
          Configure your Gmail SMTP credentials, sender identity, dispatch delays, and suppression opt-out list.
        </p>
      </div>

      {/* Gmail SMTP Guide Card */}
      <div className="card-modern p-4 mb-4 border-start border-primary border-4">
        <h6 className="fw-bold text-dark d-flex align-items-center gap-2 mb-2">
          <Key className="text-primary" size={18} /> How to configure Gmail App Password
        </h6>
        <p className="text-muted small mb-2">
          Google requires a 16-character <strong>App Password</strong> for automated Nodemailer SMTP delivery. Your personal password will not work directly.
        </p>
        <ol className="small text-secondary ps-3 mb-3">
          <li>Enable <strong>2-Step Verification</strong> on your Google Account: <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-primary text-decoration-none">Google Security <ExternalLink size={12} /></a></li>
          <li>Search for or navigate to <strong>App passwords</strong>.</li>
          <li>Enter an app name like <code>HR Bulk Mailer</code> and click <strong>Create</strong>.</li>
          <li>Copy the generated 16-character code (e.g., <code>xxxx xxxx xxxx xxxx</code>) and paste it below.</li>
        </ol>
      </div>

      {/* Sender & SMTP Config Form */}
      <div className="card-modern p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">Sender Profile & SMTP Credentials</h5>
          {settings.smtpConnected ? (
            <span className="badge bg-success-subtle text-success border border-success-subtle d-flex align-items-center gap-1">
              <CheckCircle2 size={13} /> SMTP Connected
            </span>
          ) : (
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle d-flex align-items-center gap-1">
              <AlertCircle size={13} /> SMTP Not Connected
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Sender Full Name *</label>
              <input
                type="text"
                className="form-control"
                value={settings.sender_name}
                onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
                required
              />
              <small className="text-muted">Displayed in recruiter email client inbox as sender.</small>
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-semibold">Gmail Sender Address *</label>
              <input
                type="email"
                className="form-control"
                value={settings.sender_email}
                onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
                required
              />
              <small className="text-muted">Must match your authenticated Google account.</small>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">
              Google App Password (16 characters)
            </label>
            <input
              type="password"
              className="form-control font-monospace"
              placeholder="Leave blank to keep existing password, or enter new 16-character code"
              value={gmailAppPassword}
              onChange={(e) => setGmailAppPassword(e.target.value)}
            />
            <small className="text-muted">
              Securely stored in your environment and server memory. Never exposed to browser or API responses.
            </small>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-sm-6">
              <label className="form-label small fw-semibold">Delay Between Emails (Seconds)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-control"
                value={settings.send_delay_seconds}
                onChange={(e) => setSettings({ ...settings, send_delay_seconds: e.target.value })}
              />
              <small className="text-muted">Recommended: 2 seconds to avoid triggering spam filters.</small>
            </div>
            <div className="col-sm-6">
              <label className="form-label small fw-semibold">Max Retries for Transient Errors</label>
              <input
                type="number"
                min="0"
                max="5"
                className="form-control"
                value={settings.max_retries}
                onChange={(e) => setSettings({ ...settings, max_retries: e.target.value })}
              />
              <small className="text-muted">Automatic retries on momentary network interruptions.</small>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 rounded-3"
              onClick={handleTestSmtp}
              disabled={testingSmtp}
            >
              <RefreshCw size={14} className={testingSmtp ? 'spinner-border spinner-border-sm' : ''} />
              {testingSmtp ? 'Verifying SMTP...' : 'Test SMTP Connection'}
            </button>
            <button
              type="submit"
              disabled={savingSettings}
              className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-4 shadow-sm"
              style={{ backgroundColor: '#1d4ed8' }}
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {testResult && (
          <div className={`mt-3 p-3 rounded-3 small border ${testResult.success ? 'bg-success-subtle text-success border-success-subtle' : 'bg-danger-subtle text-danger border-danger-subtle'}`}>
            <div className="fw-bold mb-1">{testResult.success ? 'Connection Successful!' : 'Connection Warning:'}</div>
            <div>{testResult.message}</div>
          </div>
        )}
      </div>

      {/* WhatsApp Web Device Linking Card */}
      <div className="card-modern p-4 mb-4" style={{ borderLeft: '4px solid #25D366' }}>
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-sm"
              style={{ width: 38, height: 38, backgroundColor: '#25D366' }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">WhatsApp Web Device Linking</h5>
              <small className="text-muted">Direct 1-click messaging from your personal phone number</small>
            </div>
          </div>

          <div>
            {whatsappStatus.connected ? (
              <span className="badge bg-success-subtle text-success px-3 py-1.5 rounded-pill small fw-semibold d-inline-flex align-items-center gap-1.5">
                <CheckCircle2 size={14} /> Connected: +{whatsappStatus.phone}
              </span>
            ) : (
              <span className="badge bg-secondary-subtle text-secondary px-3 py-1.5 rounded-pill small fw-semibold">
                Not Connected
              </span>
            )}
          </div>
        </div>

        {whatsappStatus.connected ? (
          <div className="p-3 rounded-3 border bg-success bg-opacity-10 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div className="d-flex align-items-center gap-2.5">
              <Smartphone size={24} className="text-success" />
              <div>
                <div className="fw-bold text-dark small">Your WhatsApp is Linked & Ready!</div>
                <div className="text-muted" style={{ fontSize: '0.775rem' }}>
                  Messages sent from the portal will be directly dispatched from <strong>+{whatsappStatus.phone}</strong>. Replies from HR will arrive right in your phone's WhatsApp.
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1.5 px-3 rounded-3"
              onClick={handleDisconnectWhatsapp}
              disabled={loadingWa}
            >
              <PowerOff size={14} />
              <span>{loadingWa ? 'Disconnecting...' : 'Disconnect WhatsApp'}</span>
            </button>
          </div>
        ) : (
          <div>
            <p className="text-muted small mb-3">
              Scan the QR code with your phone to link your WhatsApp. Once linked, you can send personalized outreach messages and attach your PDF resume directly to HR contacts with a single click!
            </p>

            {whatsappStatus.qrDataUrl ? (
              <div className="p-4 rounded-4 border bg-light text-center">
                <div className="mb-2 fw-bold text-dark d-flex align-items-center justify-content-center gap-1.5">
                  <QrCode size={18} className="text-success" /> Scan with WhatsApp on your Phone
                </div>
                <div className="p-2 bg-white d-inline-block rounded-3 shadow-sm border mb-3">
                  <img
                    src={whatsappStatus.qrDataUrl}
                    alt="WhatsApp QR Code"
                    style={{ width: 220, height: 220, objectFit: 'contain' }}
                  />
                </div>

                <div className="small text-muted mb-3" style={{ maxWidth: 420, margin: '0 auto' }}>
                  <ol className="text-start ps-3 mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.6' }}>
                    <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                    <li>Tap <strong>Menu (Android)</strong> or <strong>Settings (iPhone)</strong>.</li>
                    <li>Tap <strong>Linked Devices</strong> ➔ <strong>Link a Device</strong>.</li>
                    <li>Point your phone camera at this QR code to scan.</li>
                  </ol>
                </div>

                <div className="d-flex justify-content-center align-items-center gap-2">
                  <div className="spinner-grow text-success spinner-grow-sm" role="status" />
                  <span className="small text-muted">Waiting for scan from your phone...</span>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-success d-flex align-items-center gap-2 px-3 py-2 rounded-3 text-white shadow-sm fw-semibold"
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                  onClick={handleInitWhatsapp}
                  disabled={loadingWa}
                >
                  <QrCode size={16} />
                  <span>{loadingWa ? 'Generating QR Code...' : 'Link WhatsApp (Scan QR Code)'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suppression List Card */}
      <div className="card-modern p-4">
        <h5 className="fw-bold text-dark mb-1">Email Suppression & Opt-Out List</h5>
        <p className="text-muted small mb-3">
          Emails on this list are automatically excluded from all campaigns to prevent unsolicited contact and comply with communication standards.
        </p>

        {/* Add Suppression Form */}
        <form onSubmit={handleAddSuppression} className="row g-2 mb-3 align-items-end">
          <div className="col-md-5">
            <label className="form-label small fw-semibold">Email to Suppress *</label>
            <input
              type="email"
              className="form-control form-control-sm"
              placeholder="hr@donotcontact.com"
              value={newSuppressionEmail}
              onChange={(e) => setNewSuppressionEmail(e.target.value)}
              required
            />
          </div>
          <div className="col-md-5">
            <label className="form-label small fw-semibold">Reason</label>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="e.g. Unsubscribed or invalid address"
              value={newSuppressionReason}
              onChange={(e) => setNewSuppressionReason(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button
              type="submit"
              disabled={addingSuppression}
              className="btn btn-secondary btn-sm w-100 rounded-3"
            >
              <Plus size={14} className="me-1" /> Add
            </button>
          </div>
        </form>

        {/* Suppressions Table */}
        <div className="table-responsive border rounded-3" style={{ maxHeight: 220 }}>
          <table className="table table-modern table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>Suppressed Email</th>
                <th>Reason</th>
                <th>Date Added</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {suppressions.length > 0 ? (
                suppressions.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold">{s.email}</td>
                    <td className="text-muted small">{s.reason}</td>
                    <td className="text-muted small">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                        onClick={() => handleRemoveSuppression(s.id)}
                        title="Remove from suppression"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-3 text-muted small">
                    No emails currently suppressed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;

