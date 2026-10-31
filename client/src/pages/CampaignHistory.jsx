import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  History, 
  Send, 
  Eye, 
  Download, 
  RotateCcw, 
  Calendar,
  CheckCircle2,
  Clock
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const CampaignHistory = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns', { params: { page, limit: 15 } });
      setCampaigns(res.data.data.campaigns || []);
      setTotal(res.data.data.total || 0);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page]);

  const handleExportCsv = (campaignId) => {
    window.open(`${api.defaults.baseURL}/campaigns/${campaignId}/export`, '_blank');
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Campaign History & Reports</h4>
          <p className="text-muted small mb-0">
            View all past and active bulk email campaigns, progress logs, and delivery metrics.
          </p>
        </div>
        <Link
          to="/campaigns/new"
          className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-3 shadow-sm"
          style={{ backgroundColor: '#1d4ed8' }}
        >
          <Send size={15} /> Launch New Campaign
        </Link>
      </div>

      {/* Campaigns Table Card */}
      <div className="card-modern">
        <div className="table-responsive">
          <table className="table table-modern align-middle">
            <thead>
              <tr>
                <th>Campaign Details</th>
                <th>Status</th>
                <th>Total Recipients</th>
                <th>Sent / Failed / Skipped</th>
                <th>Timeline</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" />
                    Loading campaign history...
                  </td>
                </tr>
              ) : campaigns.length > 0 ? (
                campaigns.map((camp) => (
                  <tr key={camp.id}>
                    <td>
                      <Link to={`/campaigns/${camp.id}`} className="fw-bold text-dark text-decoration-none">
                        {camp.campaign_name}
                      </Link>
                      <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                        Template: {camp.template_name || 'Custom Message'} | Resume: {camp.resume_filename || 'Default'}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={camp.status} />
                    </td>
                    <td className="fw-semibold">{camp.total_recipients}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {camp.sent_count} sent
                        </span>
                        {camp.failed_count > 0 && (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                            {camp.failed_count} failed
                          </span>
                        )}
                        {camp.skipped_count > 0 && (
                          <span className="badge bg-secondary-subtle text-secondary border">
                            {camp.skipped_count} skipped
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="small text-muted">
                      <div>Created: {new Date(camp.created_at).toLocaleDateString()}</div>
                      {camp.completed_at && (
                        <div>Completed: {new Date(camp.completed_at).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <Link
                          to={`/campaigns/${camp.id}`}
                          className="btn btn-outline-primary"
                          title="Open Campaign Monitor"
                        >
                          <Eye size={14} className="me-1" /> View Monitor
                        </Link>
                        <button
                          className="btn btn-light border"
                          onClick={() => handleExportCsv(camp.id)}
                          title="Download CSV Report"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <EmptyState
                      title="No campaigns found"
                      description="You haven't launched any email campaigns yet."
                      icon={History}
                      action={
                        <Link to="/campaigns/new" className="btn btn-sm btn-primary rounded-3">
                          Create First Campaign
                        </Link>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-top d-flex align-items-center justify-content-between">
            <small className="text-muted">
              Page {page} of {totalPages}
            </small>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignHistory;

