import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Send, 
  Code, 
  CheckCircle,
  FileText,
  Sparkles,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const EXECUTIVE_TEMPLATE_BODY = `<p>Dear {{Name}},</p>

<p>I hope this email finds you well.</p>

<p>I am writing to express my strong interest in exploring software engineering opportunities at <strong>{{Company}}</strong> for the <strong>{{Title}}</strong> position.</p>

<p>I am a Software Engineer with <strong>2+ years of professional experience</strong> in developing scalable web applications, backend APIs, and database solutions. My core technical proficiencies include:</p>

<ul style="margin: 0 0 16px 20px; padding: 0;">
  <li><strong>Frontend:</strong> React.js, JavaScript, Responsive UI, Bootstrap</li>
  <li><strong>Backend:</strong> Node.js, Express.js, RESTful APIs, Microservices</li>
  <li><strong>Databases:</strong> MySQL, MongoDB, Query Optimization</li>
  <li><strong>Other Skills:</strong> Java, Android Development, Git & GitHub</li>
</ul>

<p>I am actively seeking new engineering opportunities where I can apply my problem-solving skills, contribute to challenging projects, and deliver clean, maintainable code.</p>

<p>Please find my updated resume attached for your kind review. I would welcome the opportunity for a brief conversation to discuss how my skill set can add value to your engineering team.</p>

<p>Thank you very much for your time and consideration.</p>

<p style="margin-bottom: 4px;">Best regards,</p>

<div style="margin-top: 18px; padding-top: 14px; border-top: 2px solid #e5e7eb;">
  <div style="font-size: 16px; font-weight: 700; color: #111827;">Parmeshwar Durgist</div>
  <div style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">Software Engineer | Full-Stack Developer</div>
  <div style="font-size: 13px; color: #4b5563; line-height: 1.6;">
    <div>📧 <strong>Email:</strong> <a href="mailto:durgistparmeshwar@gmail.com" style="color: #1d4ed8; text-decoration: underline;">durgistparmeshwar@gmail.com</a></div>
    <div>🌐 <strong>Portfolio:</strong> <a href="https://parmeshwar-the-series.vercel.app/" target="_blank" style="color: #1d4ed8; text-decoration: underline;">https://parmeshwar-the-series.vercel.app/</a></div>
    <div>💻 <strong>GitHub:</strong> <a href="https://github.com/parmeshwar-durgist" target="_blank" style="color: #1d4ed8; text-decoration: underline;">https://github.com/parmeshwar-durgist</a></div>
  </div>
</div>`;

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor Modal State
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: '', subject: '', body: '' });
  const [saving, setSaving] = useState(false);

  // Preview Modal State
  const [previewModal, setPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [sampleContact, setSampleContact] = useState({
    name: 'Amit Sharma',
    title: 'Software Developer',
    company: 'ABC Technologies'
  });

  // Test Email State
  const [testModal, setTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('durgistparmeshwar@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [targetTemplateForTest, setTargetTemplateForTest] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/templates');
      setTemplates(res.data.data);
    } catch (err) {
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setFormData({
      name: 'Software Engineer Application (Executive Format)',
      subject: 'Application for {{Title}} Position – Parmeshwar Durgist',
      body: EXECUTIVE_TEMPLATE_BODY
    });
    setShowEditor(true);
  };

  const handleOpenEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body
    });
    setShowEditor(true);
  };

  const insertPlaceholder = (tag, targetField = 'body') => {
    if (targetField === 'subject') {
      setFormData(prev => ({ ...prev, subject: prev.subject + ` ${tag}` }));
    } else {
      setFormData(prev => ({ ...prev, body: prev.body + ` ${tag}` }));
    }
  };

  const handleLoadExecutiveFormat = () => {
    setFormData(prev => ({
      ...prev,
      subject: 'Application for {{Title}} Position – Parmeshwar Durgist',
      body: EXECUTIVE_TEMPLATE_BODY
    }));
    toast.success('Loaded professional executive HR email format!');
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTemplate) {
        await api.put(`/templates/${editingTemplate.id}`, formData);
        toast.success('Template updated successfully');
      } else {
        await api.post('/templates', formData);
        toast.success('Template created successfully');
      }
      setShowEditor(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/templates/${deleteTarget.id}`);
      toast.success('Template deleted successfully');
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenPreview = (tpl) => {
    setPreviewTemplate(tpl);
    setPreviewModal(true);
  };

  const handleOpenTest = (tpl) => {
    setTargetTemplateForTest(tpl);
    setTestModal(true);
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress) {
      toast.error('Please enter a valid recipient email address');
      return;
    }

    setSendingTest(true);
    try {
      await api.post('/email/test', {
        recipient_email: testEmailAddress,
        subject: targetTemplateForTest.subject,
        body: targetTemplateForTest.body,
        contact_sample: sampleContact
      });
      toast.success(`Professional test email sent successfully to ${testEmailAddress}!`);
      setTestModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email. Verify SMTP settings.');
    } finally {
      setSendingTest(false);
    }
  };

  const renderInterpolated = (text) => {
    if (!text) return '';
    return text
      .replace(/{{\s*name\s*}}/gi, sampleContact.name)
      .replace(/{{\s*title\s*}}/gi, sampleContact.title)
      .replace(/{{\s*company\s*}}/gi, sampleContact.company);
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold text-dark mb-1">Email Templates</h4>
          <p className="text-muted small mb-0">
            Professional job application templates with dynamic placeholders: <code>{'{{Name}}'}</code>, <code>{'{{Title}}'}</code>, <code>{'{{Company}}'}</code>.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn btn-primary btn-sm d-flex align-items-center gap-2 rounded-3 shadow-sm align-self-start align-self-sm-center"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="row g-3 g-sm-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" />
            Loading templates...
          </div>
        ) : templates.length > 0 ? (
          templates.map((tpl) => (
            <div key={tpl.id} className="col-12 col-md-6 col-xl-4">
              <div className="card-modern h-100 d-flex flex-column justify-content-between p-3 p-sm-4">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold text-dark mb-1 text-truncate" title={tpl.name}>
                      {tpl.name}
                    </h6>
                    <span className="badge bg-light text-muted border font-monospace small">
                      #{tpl.id}
                    </span>
                  </div>
                  <div className="text-muted small mb-3">
                    <strong>Subject:</strong> <span className="text-dark">{tpl.subject}</span>
                  </div>
                  <div
                    className="p-3 bg-light rounded-3 text-secondary small border"
                    style={{
                      maxHeight: 160,
                      overflowY: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: 1.6
                    }}
                    dangerouslySetInnerHTML={{ __html: tpl.body }}
                  />
                </div>

                <div className="pt-3 mt-3 border-top d-flex align-items-center justify-content-between">
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleOpenPreview(tpl)}
                      title="Preview rendered email"
                    >
                      <Eye size={14} className="me-1" /> Preview
                    </button>
                    <button
                      className="btn btn-light border"
                      onClick={() => handleOpenTest(tpl)}
                      title="Send test email to yourself"
                    >
                      <Send size={14} className="me-1 text-primary" /> Test
                    </button>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-light border"
                      onClick={() => handleOpenEdit(tpl)}
                      title="Edit template"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-light border text-danger"
                      onClick={() => setDeleteTarget(tpl)}
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <EmptyState
              title="No templates found"
              description="Create a personalized application template to use in campaigns."
              action={
                <button onClick={handleOpenAdd} className="btn btn-sm btn-primary rounded-3">
                  Create First Template
                </button>
              }
            />
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(9, 14, 26, 0.72)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEditor(false)} />
              </div>
              <form onSubmit={handleSaveTemplate}>
                <div className="modal-body p-3 p-sm-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
                    <div className="flex-grow-1">
                      <label className="form-label small fw-semibold mb-1">Template Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Software Engineer Application (Executive Format)"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="align-self-sm-end">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm rounded-3 shadow-sm text-nowrap"
                        onClick={handleLoadExecutiveFormat}
                        title="Load executive paragraph layout with signature"
                      >
                        <Sparkles size={14} /> Load Executive Format
                      </button>
                    </div>
                  </div>

                  {/* Placeholder Insert Chips */}
                  <div className="mb-3 p-2 bg-light rounded-3 border d-flex flex-wrap align-items-center gap-1.5">
                    <span className="small text-muted fw-bold me-1" style={{ fontSize: '0.75rem' }}>Insert Tags:</span>
                    <button
                      type="button"
                      className="placeholder-chip"
                      onClick={() => insertPlaceholder('{{Name}}')}
                    >
                      + {'{{Name}}'}
                    </button>
                    <button
                      type="button"
                      className="placeholder-chip"
                      onClick={() => insertPlaceholder('{{Title}}')}
                    >
                      + {'{{Title}}'}
                    </button>
                    <button
                      type="button"
                      className="placeholder-chip"
                      onClick={() => insertPlaceholder('{{Company}}')}
                    >
                      + {'{{Company}}'}
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold mb-1">Email Subject Line *</label>
                    <input
                      type="text"
                      className="form-control font-monospace"
                      placeholder="Application for {{Title}} Position – Parmeshwar Durgist"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold mb-1">
                      Email Body (HTML formatted for Gmail & Outlook) *
                    </label>
                    <textarea
                      rows={11}
                      className="form-control font-monospace small"
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      required
                      style={{ lineHeight: 1.5 }}
                    />
                    <div className="form-text small text-muted">
                      Supports clean paragraphs (<code>&lt;p&gt;</code>), bold text (<code>&lt;strong&gt;</code>), bullet lists (<code>&lt;ul&gt;&lt;li&gt;</code>), and email links.
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setShowEditor(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {previewModal && previewTemplate && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(9, 14, 26, 0.72)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header border-bottom bg-light">
                <div>
                  <h5 className="modal-title fw-bold">Live Recruiter View Simulation</h5>
                  <small className="text-muted">How this email renders in Gmail / Outlook for the HR recruiter</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setPreviewModal(false)} />
              </div>
              <div className="modal-body p-3 p-sm-4">
                {/* Sample Recruiter Quick Customization */}
                <div className="card-modern p-2.5 p-sm-3 mb-3 bg-light border">
                  <div className="row g-2">
                    <div className="col-12 col-sm-4">
                      <label className="small fw-semibold text-muted">Sample Name:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={sampleContact.name}
                        onChange={(e) => setSampleContact({ ...sampleContact, name: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-sm-4">
                      <label className="small fw-semibold text-muted">Sample Role:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={sampleContact.title}
                        onChange={(e) => setSampleContact({ ...sampleContact, title: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-sm-4">
                      <label className="small fw-semibold text-muted">Sample Company:</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={sampleContact.company}
                        onChange={(e) => setSampleContact({ ...sampleContact, company: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Simulated Email Client Container */}
                <div className="border rounded-3 p-3 p-sm-4 bg-white shadow-sm" style={{ borderColor: '#e2e8f0' }}>
                  {/* Email Headers Header Bar */}
                  <div className="border-bottom pb-3 mb-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="badge bg-light text-secondary border">From:</span>
                      <strong className="text-dark small">Parmeshwar Durgist &lt;parmeshwardurgist@gmail.com&gt;</strong>
                    </div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-light text-secondary border">To:</span>
                      <span className="text-dark small">{sampleContact.name} &lt;hr@{sampleContact.company.toLowerCase().replace(/\s+/g, '')}.com&gt;</span>
                    </div>
                    <div>
                      <span className="text-muted small">Subject:</span>
                      <h6 className="fw-bold text-dark mb-0 mt-0.5">{renderInterpolated(previewTemplate.subject)}</h6>
                    </div>
                  </div>

                  {/* Rendered HTML Email Content with Paragraphs */}
                  <div
                    className="email-rendered-preview"
                    style={{ fontSize: '15px', lineHeight: '1.65', color: '#1f2937' }}
                    dangerouslySetInnerHTML={{ __html: renderInterpolated(previewTemplate.body) }}
                  />

                  {/* Attachment Card */}
                  <div className="mt-4 pt-3 border-top">
                    <div className="p-2.5 rounded-3 border bg-light d-inline-flex align-items-center gap-2">
                      <FileText size={20} className="text-danger flex-shrink-0" />
                      <div>
                        <div className="fw-bold small text-dark mb-0">Parmeshwar_Durgist_Resume.pdf</div>
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>PDF Attachment • Verified</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top bg-light">
                <button className="btn btn-secondary btn-sm" onClick={() => setPreviewModal(false)}>
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      {testModal && targetTemplateForTest && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(9, 14, 26, 0.72)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">Send Instant Test Email</h5>
                <button type="button" className="btn-close" onClick={() => setTestModal(false)} />
              </div>
              <form onSubmit={handleSendTestEmail}>
                <div className="modal-body p-3 p-sm-4">
                  <p className="text-muted small mb-3">
                    Send a test email to your personal inbox to verify that paragraphs, bold headings, bullet lists, and your resume PDF attachment render in Gmail.
                  </p>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Destination Test Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="parmeshwardurgist@gmail.com"
                      required
                    />
                  </div>
                  <div className="p-3 bg-light rounded-3 border small">
                    <div className="mb-1"><strong>Template:</strong> {targetTemplateForTest.name}</div>
                    <div className="text-truncate"><strong>Subject:</strong> {targetTemplateForTest.subject}</div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light border" onClick={() => setTestModal(false)} disabled={sendingTest}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={sendingTest}>
                    {sendingTest ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <Send size={15} className="me-1" /> Send Test Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Template"
        message={`Are you sure you want to delete template "${deleteTarget?.name}"?`}
        confirmText="Delete Template"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default EmailTemplates;
