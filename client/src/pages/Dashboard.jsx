import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckCircle, 
  Send, 
  Clock, 
  FileSpreadsheet, 
  FileText, 
  History, 
  ArrowRight,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import api from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title & Intro */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
            HR Bulk Email Sender
          </h4>
          <p className="text-muted small mb-0">
            Real-time analytics for your IT recruitment outreach and job application campaigns.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/import" className="btn btn-light btn-sm rounded-3 shadow-sm flex-fill flex-sm-grow-0">
            <FileSpreadsheet size={15} className="text-primary" /> <span className="d-inline">Import Excel</span>
          </Link>
          <Link to="/campaigns/new" className="btn btn-primary btn-sm rounded-3 shadow-sm flex-fill flex-sm-grow-0">
            <Send size={15} /> <span className="d-inline">New Campaign</span>
          </Link>
        </div>
      </div>

      {/* SMTP Configuration Notice if not set up */}
      {stats && !stats.smtpConfigured && (
        <div className="card-modern p-3 p-sm-4 mb-4 border-start border-warning border-4 bg-warning-subtle bg-opacity-25">
          <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-warning text-dark p-2 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 40, height: 40 }}
              >
                <AlertCircle size={22} />
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-dark">Gmail SMTP Credentials Needed</h6>
                <p className="mb-0 small text-secondary">
                  To send individual personalized emails from <strong>durgistparmeshwar@gmail.com</strong>, configure your 16-character Google App Password in Settings.
                </p>
              </div>
            </div>
            <Link to="/settings" className="btn btn-sm btn-dark text-nowrap rounded-3 shadow-sm align-self-start align-self-sm-center">
              Configure SMTP
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards Grid: 2 columns on mobile, 4 on desktop */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard
            title="HR Contacts"
            value={stats?.totalContacts}
            icon={Users}
            color="#2563eb"
            bg="#eff6ff"
            subtitle="Verified recruiters"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            title="Valid Emails"
            value={stats?.validEmails}
            icon={CheckCircle}
            color="#059669"
            bg="#ecfdf5"
            subtitle="Validated format"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            title="Sent Emails"
            value={stats?.emailsSent}
            icon={Send}
            color="#047857"
            bg="#f0fdf4"
            subtitle="Successfully sent"
          />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard
            title="In Queue"
            value={stats?.emailsPending}
            icon={Clock}
            color="#d97706"
            bg="#fffbeb"
            subtitle="Scheduled / pending"
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-4">
          <div className="card-modern p-3 text-center text-sm-start">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              CAMPAIGNS
            </span>
            <h4 className="fw-extrabold mt-1 mb-0">{stats?.totalCampaigns || 0}</h4>
          </div>
        </div>
        <div className="col-4">
          <div className="card-modern p-3 text-center text-sm-start">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              FAILED
            </span>
            <h4 className="fw-extrabold mt-1 mb-0 text-danger">{stats?.emailsFailed || 0}</h4>
          </div>
        </div>
        <div className="col-4">
          <div className="card-modern p-3 text-center text-sm-start">
            <span className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
              ACTIVE RESUME
            </span>
            <div className="mt-1">
              <Link to="/resumes" className="small text-primary text-decoration-none fw-semibold d-inline-flex align-items-center gap-1">
                Manage <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panel */}
      <div className="card-modern p-3 p-sm-4 mb-4">
        <h6 className="fw-bold text-dark mb-3">Quick Actions</h6>
        <div className="row g-2">
          <div className="col-6 col-md-3">
            <Link to="/import" className="btn btn-light w-100 p-3 text-start rounded-3 h-100 d-flex flex-column justify-content-between border shadow-sm">
              <div className="p-2 rounded-3 bg-primary-subtle text-primary align-self-start mb-2">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <div className="fw-bold small text-dark">Upload Excel</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Import HR lists</div>
              </div>
            </Link>
          </div>
          <div className="col-6 col-md-3">
            <Link to="/contacts" className="btn btn-light w-100 p-3 text-start rounded-3 h-100 d-flex flex-column justify-content-between border shadow-sm">
              <div className="p-2 rounded-3 bg-success-subtle text-success align-self-start mb-2">
                <Users size={20} />
              </div>
              <div>
                <div className="fw-bold small text-dark">Manage Contacts</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Filter & edit list</div>
              </div>
            </Link>
          </div>
          <div className="col-6 col-md-3">
            <Link to="/campaigns/new" className="btn btn-light w-100 p-3 text-start rounded-3 h-100 d-flex flex-column justify-content-between border shadow-sm">
              <div className="p-2 rounded-3 bg-primary-subtle text-primary align-self-start mb-2">
                <Send size={20} />
              </div>
              <div>
                <div className="fw-bold small text-dark">Create Campaign</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Personalized blast</div>
              </div>
            </Link>
          </div>
          <div className="col-6 col-md-3">
            <Link to="/logs" className="btn btn-light w-100 p-3 text-start rounded-3 h-100 d-flex flex-column justify-content-between border shadow-sm">
              <div className="p-2 rounded-3 bg-warning-subtle text-warning-emphasis align-self-start mb-2">
                <History size={20} />
              </div>
              <div>
                <div className="fw-bold small text-dark">Delivery Logs</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Audit each email</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Campaigns & Recent History */}
      <div className="row g-3 g-sm-4">
        {/* Recent Campaigns */}
        <div className="col-lg-6">
          <div className="card-modern h-100">
            <div className="card-header-clean d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">Recent Campaigns</h6>
              <Link to="/campaigns" className="small text-decoration-none fw-semibold d-flex align-items-center gap-1 text-primary">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              {stats?.recentCampaigns?.length > 0 ? (
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Campaign</th>
                      <th>Status</th>
                      <th>Recipients</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCampaigns.map((camp) => (
                      <tr key={camp.id}>
                        <td>
                          <Link to={`/campaigns/${camp.id}`} className="fw-bold text-dark text-decoration-none">
                            {camp.campaign_name}
                          </Link>
                          <div className="text-muted" style={{ fontSize: '0.725rem' }}>
                            {new Date(camp.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={camp.status} />
                        </td>
                        <td className="fw-semibold">{camp.total_recipients}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2" style={{ minWidth: 90 }}>
                            <div className="progress flex-grow-1 rounded-pill" style={{ height: 6 }}>
                              <div
                                className="progress-bar bg-success rounded-pill"
                                role="progressbar"
                                style={{
                                  width: `${camp.total_recipients ? Math.round((camp.sent_count / camp.total_recipients) * 100) : 0}%`
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.75rem' }} className="fw-bold text-muted">
                              {camp.sent_count}/{camp.total_recipients}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  title="No campaigns yet"
                  description="Create your first HR job application campaign to begin sending."
                  action={
                    <Link to="/campaigns/new" className="btn btn-sm btn-primary rounded-3 shadow-sm">
                      Start Campaign
                    </Link>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Recent Email Logs */}
        <div className="col-lg-6">
          <div className="card-modern h-100">
            <div className="card-header-clean d-flex align-items-center justify-content-between">
              <h6 className="fw-bold mb-0">Recent Sending History</h6>
              <Link to="/logs" className="small text-decoration-none fw-semibold d-flex align-items-center gap-1 text-primary">
                View all logs <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              {stats?.recentHistory?.length > 0 ? (
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Sent Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentHistory.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="fw-bold text-dark">{item.recipient_name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.recipient_email}</div>
                        </td>
                        <td className="small">{item.recipient_company || '—'}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="text-muted small" style={{ fontSize: '0.75rem' }}>
                          {item.sent_at ? new Date(item.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState
                  title="No emails sent yet"
                  description="When you start a campaign, real-time individual recipient delivery logs will appear here."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
