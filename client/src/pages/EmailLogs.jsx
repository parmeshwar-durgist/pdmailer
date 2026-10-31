import React, { useState, useEffect } from 'react';
import { 
  ListFilter, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Download, 
  Eye,
  Building,
  Mail
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const EmailLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  // Log inspect modal
  const [inspectItem, setInspectItem] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/campaigns/logs', {
        params: {
          page,
          limit: 25,
          status: statusFilter,
          company: companyFilter,
          search
        }
      });
      setLogs(res.data.data.logs || []);
      setTotal(res.data.data.total || 0);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, statusFilter, companyFilter, search]);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Recipient Email Audit Logs</h4>
          <p className="text-muted small mb-0">
            Real-time individual email logs, retry history, error reports, and delivery attempts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-modern p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white text-muted">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search recipient name, email, or company..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Filter by company..."
              value={companyFilter}
              onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div className="col-12 col-md-1 text-md-end">
            {(search || statusFilter || companyFilter) && (
              <button
                className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                onClick={() => { setSearch(''); setStatusFilter(''); setCompanyFilter(''); setPage(1); }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card-modern">
        <div className="table-responsive">
          <table className="table table-modern align-middle">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Company & Role</th>
                <th>Campaign</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Last Update</th>
                <th className="text-end">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" />
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className={log.status === 'failed' ? 'table-danger bg-opacity-10' : ''}>
                    <td>
                      <div className="fw-semibold text-dark">{log.recipient_name}</div>
                      <small className="text-muted">{log.recipient_email}</small>
                    </td>
                    <td>
                      <div>{log.recipient_company || '—'}</div>
                      <small className="text-muted">{log.recipient_title || '—'}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {log.campaign_name}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={log.status} />
                    </td>
                    <td>{log.attempt_count}</td>
                    <td className="small text-muted">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : new Date(log.updated_at).toLocaleString()}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-light btn-sm border"
                        onClick={() => setInspectItem(log)}
                        title="Inspect rendered email and details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      title="No logs found"
                      description="No recipient email activity matches the active filter."
                      icon={ListFilter}
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
              Showing page {page} of {totalPages} ({total} logs total)
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

      {/* Inspect Item Modal */}
      {inspectItem && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold">Recipient Email Details</h5>
                  <small className="text-muted">Job ID #{inspectItem.id} | Campaign #{inspectItem.campaign_id}</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setInspectItem(null)} />
              </div>
              <div className="modal-body p-4">
                <div className="row g-2 mb-3 bg-light p-3 rounded-3 border">
                  <div className="col-sm-6">
                    <span className="small text-muted d-block">Recipient:</span>
                    <strong>{inspectItem.recipient_name} ({inspectItem.recipient_email})</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="small text-muted d-block">Company & Role:</span>
                    <strong>{inspectItem.recipient_company} – {inspectItem.recipient_title}</strong>
                  </div>
                  <div className="col-sm-6">
                    <span className="small text-muted d-block">Status:</span>
                    <StatusBadge status={inspectItem.status} />
                  </div>
                  <div className="col-sm-6">
                    <span className="small text-muted d-block">Attempts:</span>
                    <strong>{inspectItem.attempt_count}</strong>
                  </div>
                </div>

                {inspectItem.last_error && (
                  <div className="alert alert-danger p-3 small mb-3">
                    <div className="fw-bold mb-1">Error Information:</div>
                    <code>{inspectItem.last_error}</code>
                  </div>
                )}

                <div className="border rounded-3 p-3 bg-white">
                  <div className="border-bottom pb-2 mb-3">
                    <span className="small text-muted d-block">Rendered Subject:</span>
                    <h6 className="fw-bold text-dark mb-0">{inspectItem.rendered_subject}</h6>
                  </div>
                  <span className="small text-muted d-block mb-2">Rendered Message Body:</span>
                  <div
                    className="p-3 bg-light rounded-3 small"
                    dangerouslySetInnerHTML={{ __html: inspectItem.rendered_body }}
                  />
                </div>
              </div>
              <div className="modal-footer border-top">
                <button className="btn btn-secondary btn-sm" onClick={() => setInspectItem(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailLogs;

