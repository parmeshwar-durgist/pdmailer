import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  XCircle, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  FileText, 
  ArrowLeft,
  Search,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const CampaignProgress = () => {
  const { id } = useParams();

  const [campaign, setCampaign] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientsTotal, setRecipientsTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaign(res.data.data);
    } catch (err) {
      toast.error('Failed to load campaign data');
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await api.get(`/campaigns/${id}/recipients`, {
        params: { page, limit: 20, status: statusFilter, search }
      });
      setRecipients(res.data.data.recipients || []);
      setRecipientsTotal(res.data.data.total || 0);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCampaign();
    fetchRecipients();
  }, [id, page, statusFilter, search]);

  // Polling while campaign is 'processing' or 'queued'
  useEffect(() => {
    let interval = null;
    if (campaign && (campaign.status === 'processing' || campaign.status === 'queued')) {
      interval = setInterval(() => {
        fetchCampaign();
        fetchRecipients();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [campaign?.status, page, statusFilter]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/start`);
      toast.success('Campaign sending started.');
      fetchCampaign();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/pause`);
      toast.success('Campaign paused.');
      fetchCampaign();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pause campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/resume`);
      toast.success('Campaign resumed.');
      fetchCampaign();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resume campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.post(`/campaigns/${id}/cancel`);
      toast.success('Campaign cancelled.');
      setShowCancelModal(false);
      fetchCampaign();
      fetchRecipients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/campaigns/${id}/retry-failed`);
      toast.success(res.data.message || 'Queued failed recipients for retry.');
      fetchCampaign();
      fetchRecipients();
    } catch (err) {
      toast.error('Failed to retry failed recipients');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`${api.defaults.baseURL}/campaigns/${id}/export`, '_blank');
  };

  if (!campaign && loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const percentComplete = campaign?.total_recipients
    ? Math.round(((campaign.sent_count + campaign.failed_count + campaign.skipped_count) / campaign.total_recipients) * 100)
    : 0;

  return (
    <div>
      {/* Top Breadcrumb & Controls */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <Link to="/campaigns" className="text-decoration-none text-muted small d-inline-flex align-items-center gap-1 mb-1">
            <ArrowLeft size={14} /> Back to Campaigns History
          </Link>
          <div className="d-flex align-items-center gap-2">
            <h4 className="fw-bold text-dark mb-0">{campaign?.campaign_name}</h4>
            <StatusBadge status={campaign?.status} />
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2">
          {campaign?.status === 'queued' && (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="btn btn-success btn-sm d-flex align-items-center gap-1 rounded-3"
            >
              <Play size={14} /> Start Sending
            </button>
          )}

          {campaign?.status === 'processing' && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="btn btn-warning btn-sm d-flex align-items-center gap-1 rounded-3"
            >
              <Pause size={14} /> Pause
            </button>
          )}

          {campaign?.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="btn btn-primary btn-sm d-flex align-items-center gap-1 rounded-3"
            >
              <Play size={14} /> Resume
            </button>
          )}

          {(campaign?.status === 'processing' || campaign?.status === 'paused' || campaign?.status === 'queued') && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 rounded-3"
            >
              <XCircle size={14} /> Cancel Campaign
            </button>
          )}

          {campaign?.failed_count > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={actionLoading}
              className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1 rounded-3"
            >
              <RotateCcw size={14} /> Retry Failed ({campaign.failed_count})
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 rounded-3"
          >
            <Download size={14} /> Export Report CSV
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="card-modern p-4 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-bold small text-dark">Overall Dispatch Progress</span>
          <span className="fw-bold text-primary">{percentComplete}% Complete</span>
        </div>
        <div className="progress mb-3" style={{ height: 10 }}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${campaign?.total_recipients ? (campaign.sent_count / campaign.total_recipients) * 100 : 0}%` }}
          />
          <div
            className="progress-bar bg-danger"
            role="progressbar"
            style={{ width: `${campaign?.total_recipients ? (campaign.failed_count / campaign.total_recipients) * 100 : 0}%` }}
          />
          <div
            className="progress-bar bg-secondary"
            role="progressbar"
            style={{ width: `${campaign?.total_recipients ? (campaign.skipped_count / campaign.total_recipients) * 100 : 0}%` }}
          />
        </div>

        {/* Breakdown Stats */}
        <div className="row g-2 text-center pt-2">
          <div className="col">
            <div className="p-2 bg-light rounded-3">
              <span className="text-muted small d-block">TOTAL</span>
              <strong className="fs-5 text-dark">{campaign?.total_recipients}</strong>
            </div>
          </div>
          <div className="col">
            <div className="p-2 bg-light rounded-3">
              <span className="text-success small d-block">SENT</span>
              <strong className="fs-5 text-success">{campaign?.sent_count}</strong>
            </div>
          </div>
          <div className="col">
            <div className="p-2 bg-light rounded-3">
              <span className="text-danger small d-block">FAILED</span>
              <strong className="fs-5 text-danger">{campaign?.failed_count}</strong>
            </div>
          </div>
          <div className="col">
            <div className="p-2 bg-light rounded-3">
              <span className="text-secondary small d-block">SKIPPED</span>
              <strong className="fs-5 text-secondary">{campaign?.skipped_count}</strong>
            </div>
          </div>
          <div className="col">
            <div className="p-2 bg-light rounded-3">
              <span className="text-warning small d-block">PENDING</span>
              <strong className="fs-5 text-warning">
                {(campaign?.total_recipients || 0) - ((campaign?.sent_count || 0) + (campaign?.failed_count || 0) + (campaign?.skipped_count || 0))}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Level Status Table */}
      <div className="card-modern">
        <div className="card-header-clean d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <h6 className="fw-bold mb-0">Recipient Audit Log</h6>
            <small className="text-muted">Live per-recipient transmission status</small>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ width: 140 }}
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="skipped">Skipped</option>
            </select>
            <div className="input-group input-group-sm" style={{ width: 220 }}>
              <span className="input-group-text bg-white text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search recipient..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-modern align-middle">
            <thead>
              <tr>
                <th>Recipient Name</th>
                <th>Email</th>
                <th>Role & Company</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Error / Remarks</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recipients.length > 0 ? (
                recipients.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-semibold text-dark">{r.recipient_name}</td>
                    <td>{r.recipient_email}</td>
                    <td>
                      <div>{r.recipient_title || '—'}</div>
                      <small className="text-muted">{r.recipient_company || '—'}</small>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.attempt_count}</td>
                    <td>
                      {r.last_error ? (
                        <span className="text-danger small" title={r.last_error} style={{ maxWidth: 220, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.last_error}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td className="text-muted small">
                      {r.sent_at ? new Date(r.sent_at).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-muted small">
                    No recipients match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Campaign"
        message="Are you sure you want to stop and cancel sending to the remaining recipients in this campaign?"
        confirmText="Cancel Campaign"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
};

export default CampaignProgress;

