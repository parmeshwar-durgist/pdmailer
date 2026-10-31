import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const ResumeManager = () => {
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/resumes');
      setResumes(res.data.data);
    } catch (err) {
      toast.error('Failed to load resumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a valid PDF document (.pdf)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume PDF file size must be less than 5 MB.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('make_active', 'true');

    setUploading(true);
    try {
      await api.post('/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Resume uploaded and set as active!');
      fetchResumes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetActive = async (id) => {
    try {
      await api.put(`/resumes/${id}/activate`);
      toast.success('Resume marked as active for upcoming campaigns.');
      fetchResumes();
    } catch (err) {
      toast.error('Failed to set active resume');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/resumes/${deleteTarget.id}`);
      toast.success('Resume deleted successfully.');
      setDeleteTarget(null);
      fetchResumes();
    } catch (err) {
      toast.error('Failed to delete resume');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = (id, filename) => {
    window.open(`${api.defaults.baseURL}/resumes/${id}/download`, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Resume Management</h4>
          <p className="text-muted small mb-0">
            Upload and manage your PDF resume. The active resume is automatically attached to all campaign emails.
          </p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-3 shadow-sm"
            style={{ backgroundColor: '#1d4ed8' }}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} /> Upload New PDF Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security Note */}
      <div className="card-modern p-3 mb-4 bg-light">
        <div className="d-flex align-items-center gap-3">
          <ShieldCheck className="text-success flex-shrink-0" size={24} />
          <div>
            <div className="fw-semibold small text-dark">Secure Server Storage</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
              Resumes are stored securely in a protected backend directory outside the public web root. Only verified PDF files under 5MB are accepted.
            </div>
          </div>
        </div>
      </div>

      {/* Resumes List */}
      <div className="card-modern">
        <div className="card-header-clean">
          <h6 className="fw-bold mb-0">Uploaded Resumes ({resumes.length})</h6>
        </div>
        <div className="table-responsive">
          <table className="table table-modern align-middle">
            <thead>
              <tr>
                <th>Document Details</th>
                <th>File Size</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" />
                    Loading resumes...
                  </td>
                </tr>
              ) : resumes.length > 0 ? (
                resumes.map((resume) => (
                  <tr key={resume.id} className={resume.is_active ? 'table-primary bg-opacity-10' : ''}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-light text-danger rounded-2 border">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{resume.original_filename}</div>
                          <small className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                            {resume.stored_filename}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{formatFileSize(resume.file_size)}</td>
                    <td className="text-muted small">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      {resume.is_active ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1">
                          <CheckCircle size={13} /> Active Attachment
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        {!resume.is_active && (
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleSetActive(resume.id)}
                            title="Set as active attachment"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          className="btn btn-light border"
                          onClick={() => handleDownload(resume.id, resume.original_filename)}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn btn-light border text-danger"
                          onClick={() => setDeleteTarget(resume)}
                          title="Delete resume"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">
                    <EmptyState
                      title="No resume uploaded yet"
                      description="Please upload your PDF resume so it can be attached to your job applications."
                      icon={FileText}
                      action={
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-sm btn-primary rounded-3"
                        >
                          Upload Resume PDF
                        </button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Resume"
        message={`Are you sure you want to permanently delete "${deleteTarget?.original_filename}"?`}
        confirmText="Delete File"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ResumeManager;

