import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  Edit, 
  Send, 
  Filter, 
  CheckSquare, 
  Square,
  Building2,
  Briefcase,
  MessageSquare,
  Phone,
  FileText,
  Sparkles,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import api from '../services/api';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import toast from 'react-hot-toast';

const Contacts = () => {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [companies, setCompanies] = useState([]);
  const [titles, setTitles] = useState([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', title: '', company: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Direct WhatsApp Send Modal
  const [whatsappModal, setWhatsappModal] = useState({
    isOpen: false,
    contact: null,
    templates: [],
    selectedTemplateId: '',
    message: '',
    phone: '',
    attachResume: true,
    resumes: [],
    selectedResumeId: '',
    sending: false
  });

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', {
        params: {
          page,
          limit: 15,
          search,
          company: selectedCompany,
          title: selectedTitle
        }
      });
      setContacts(res.data.data.contacts);
      setTotal(res.data.data.total);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await api.get('/contacts/filters');
      setCompanies(res.data.data.companies || []);
      setTitles(res.data.data.titles || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [page, search, selectedCompany, selectedTitle]);

  const handleSelectAll = () => {
    if (selectedIds.size === contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  };

  const handleToggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleOpenAdd = () => {
    setEditingContact(null);
    setContactForm({ name: '', email: '', phone: '', title: '', company: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || '',
      title: contact.title || '',
      company: contact.company || ''
    });
    setShowAddModal(true);
  };

  const handleOpenWhatsApp = async (contact) => {
    try {
      const [tplRes, resumeRes] = await Promise.all([
        api.get('/whatsapp/templates'),
        api.get('/resumes')
      ]);

      const templates = tplRes.data.data || [];
      const resumes = resumeRes.data.data || [];
      const activeResume = resumes.find(r => r.is_active);

      // Default message with contact details interpolated
      const initialTemplate = templates[0];
      let initialBody = initialTemplate ? initialTemplate.body : 'Hello {{Name}}, I am reaching out regarding opportunities for {{Title}} at {{Company}}.';
      initialBody = initialBody
        .replace(/{{Name}}/g, contact.name || 'Hiring Manager')
        .replace(/{{Title}}/g, contact.title || 'Software Engineer')
        .replace(/{{Company}}/g, contact.company || 'your organization');

      setWhatsappModal({
        isOpen: true,
        contact,
        templates,
        selectedTemplateId: initialTemplate ? initialTemplate.id : '',
        message: initialBody,
        phone: contact.phone || '',
        attachResume: !!activeResume,
        resumes,
        selectedResumeId: activeResume ? activeResume.id : '',
        sending: false
      });
    } catch (err) {
      toast.error('Failed to prepare WhatsApp message. Please check connection.');
    }
  };

  const handleSelectTemplate = (templateId) => {
    const tpl = whatsappModal.templates.find(t => String(t.id) === String(templateId));
    if (!tpl || !whatsappModal.contact) return;

    let body = tpl.body
      .replace(/{{Name}}/g, whatsappModal.contact.name || 'Hiring Manager')
      .replace(/{{Title}}/g, whatsappModal.contact.title || 'Software Engineer')
      .replace(/{{Company}}/g, whatsappModal.contact.company || 'your organization');

    setWhatsappModal(prev => ({
      ...prev,
      selectedTemplateId: templateId,
      message: body
    }));
  };

  const handleSendDirectWhatsApp = async (e) => {
    e.preventDefault();
    if (!whatsappModal.phone.trim()) {
      toast.error('Please enter a valid WhatsApp phone number with country code (e.g. +91 9876543210).');
      return;
    }
    if (!whatsappModal.message.trim()) {
      toast.error('Please write a message to send.');
      return;
    }

    let normalizedPhone = whatsappModal.phone.trim().replace(/\D/g, '');
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    if (normalizedPhone.length === 10 && /^[6-9]/.test(normalizedPhone)) {
      normalizedPhone = '91' + normalizedPhone;
    }

    setWhatsappModal(prev => ({ ...prev, sending: true }));
    try {
      const res = await api.post('/whatsapp/send-direct', {
        contactId: whatsappModal.contact?.id,
        phone: normalizedPhone || whatsappModal.phone.trim(),
        message: whatsappModal.message.trim(),
        resumeId: whatsappModal.attachResume ? whatsappModal.selectedResumeId : null
      });

      toast.success(res.data.message || 'WhatsApp message sent directly!');
      setWhatsappModal(prev => ({ ...prev, isOpen: false, sending: false }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send WhatsApp message. Ensure your WhatsApp is connected in Settings.');
      setWhatsappModal(prev => ({ ...prev, sending: false }));
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      if (editingContact) {
        await api.put(`/contacts/${editingContact.id}`, contactForm);
        toast.success('Contact updated successfully');
      } else {
        await api.post('/contacts', contactForm);
        toast.success('Contact added successfully');
      }
      setShowAddModal(false);
      fetchContacts();
      fetchFilters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/contacts/${deleteTarget.id}`);
      toast.success('Contact deleted successfully');
      setDeleteTarget(null);
      fetchContacts();
      fetchFilters();
    } catch (err) {
      toast.error('Failed to delete contact');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`${api.defaults.baseURL}/contacts/export`, '_blank');
  };

  const handleLaunchCampaign = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one contact to create a campaign.');
      return;
    }
    sessionStorage.setItem('selected_campaign_contacts', JSON.stringify(Array.from(selectedIds)));
    navigate('/campaigns/new');
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-extrabold text-dark mb-1">HR Contacts</h4>
          <p className="text-muted small mb-0">
            {total} verified IT recruiter contacts. Select contacts to launch a personalized campaign.
          </p>
        </div>
        <div className="d-flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleLaunchCampaign}
              className="btn btn-primary btn-sm rounded-3 shadow-sm"
            >
              <Send size={15} /> Launch ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="btn btn-light btn-sm rounded-3 border shadow-sm"
          >
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => navigate('/import')}
            className="btn btn-light btn-sm rounded-3 border shadow-sm"
          >
            <Upload size={15} /> Import
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary btn-sm rounded-3 shadow-sm"
          >
            <Plus size={15} /> Add Contact
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-modern p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white text-muted border-end-0">
                <Search size={14} />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder="Search name, email, title, or company..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Companies</option>
              {companies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedTitle}
              onChange={(e) => {
                setSelectedTitle(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Job Titles</option>
              {titles.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table Card */}
      <div className="card-modern">
        <div className="table-responsive">
          <table className="table table-modern align-middle">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <button
                    className="btn btn-sm p-0 border-0 text-secondary"
                    onClick={handleSelectAll}
                    title="Select all on this page"
                  >
                    {contacts.length > 0 && selectedIds.size === contacts.length ? (
                      <CheckSquare size={18} className="text-primary" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th>Name & Email</th>
                <th>Phone / WhatsApp</th>
                <th>Job Title</th>
                <th>Company</th>
                <th className="d-none d-md-table-cell">Added Date</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary spinner-border-sm me-2" />
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length > 0 ? (
                contacts.map((contact) => {
                  const isChecked = selectedIds.has(contact.id);
                  return (
                    <tr key={contact.id} className={isChecked ? 'table-primary bg-opacity-10' : ''}>
                      <td>
                        <button
                          className="btn btn-sm p-0 border-0"
                          onClick={() => handleToggleSelect(contact.id)}
                        >
                          {isChecked ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} className="text-muted" />
                          )}
                        </button>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{contact.name}</div>
                        <a href={`mailto:${contact.email}`} className="text-decoration-none text-primary small">
                          {contact.email}
                        </a>
                      </td>
                      <td>
                        {contact.phone ? (
                          <span className="small text-dark fw-medium d-inline-flex align-items-center gap-1">
                            <Phone size={12} className="text-muted" />
                            {contact.phone}
                          </span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>
                        <span className="small text-secondary">{contact.title || '—'}</span>
                      </td>
                      <td>
                        {contact.company ? (
                          <span className="badge bg-light text-dark border fw-medium">
                            {contact.company}
                          </span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td className="text-muted small d-none d-md-table-cell">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {/* 💬 Direct Send WhatsApp Button */}
                          <button
                            className="btn btn-light border text-success"
                            title="Direct Send WhatsApp Message with Resume"
                            onClick={() => handleOpenWhatsApp(contact)}
                            style={{ backgroundColor: 'rgba(37, 211, 102, 0.08)' }}
                          >
                            <MessageSquare size={14} className="text-success" />
                          </button>

                          <button
                            className="btn btn-light border"
                            title="Edit contact"
                            onClick={() => handleOpenEdit(contact)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-light border text-danger"
                            title="Delete contact"
                            onClick={() => setDeleteTarget(contact)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      title="No HR contacts found"
                      description="You can add a contact manually or import an Excel contact sheet."
                      action={
                        <button onClick={handleOpenAdd} className="btn btn-sm btn-primary rounded-3 shadow-sm">
                          Add First Contact
                        </button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-top d-flex align-items-center justify-content-between">
            <small className="text-muted">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </small>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-light border"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-light border"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(9, 14, 26, 0.7)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold">
                  {editingContact ? 'Edit HR Contact' : 'Add New HR Contact'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)} />
              </div>
              <form onSubmit={handleSaveContact}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Amit Sharma"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. amit@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone / WhatsApp Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. +91 9876543210 (with country code)"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Include country code (e.g. +91 or +1) to send WhatsApp messages directly from the portal.
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Job Title / Role</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Senior Technical Recruiter"
                      value={contactForm.title}
                      onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Company Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. ABC Technologies"
                      value={contactForm.company}
                      onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setShowAddModal(false)}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Saving...' : editingContact ? 'Update Contact' : 'Save Contact'}
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
        title="Delete Contact"
        message={`Are you sure you want to delete ${deleteTarget?.name} (${deleteTarget?.email}) from contacts?`}
        confirmText="Delete Contact"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 💬 Direct Send WhatsApp Modal */}
      {whatsappModal.isOpen && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(9, 14, 26, 0.75)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden">
              {/* Header */}
              <div
                className="p-3 text-white d-flex align-items-center justify-content-between"
                style={{ backgroundColor: '#128C7E' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white"
                    style={{ width: 36, height: 36, backgroundColor: '#25D366' }}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-white">Direct Send WhatsApp Message</h6>
                    <small style={{ color: '#dcf8c6' }}>
                      To: {whatsappModal.contact?.name} {whatsappModal.contact?.company ? `(${whatsappModal.contact?.company})` : ''}
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                />
              </div>

              {/* Form */}
              <form onSubmit={handleSendDirectWhatsApp}>
                <div className="modal-body p-4 bg-light bg-opacity-50">
                  <div className="d-flex align-items-center justify-content-between p-2 px-3 mb-3 bg-white rounded-3 border">
                    <div className="d-flex align-items-center gap-2 small text-muted">
                      <Smartphone size={15} style={{ color: '#25D366' }} />
                      <span>Sends direct from your WhatsApp Web session</span>
                    </div>
                    <a
                      href="/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="small text-decoration-none fw-semibold text-primary d-flex align-items-center gap-1"
                    >
                      <span>QR Code Settings</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Phone Input */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-dark">
                      Recipient WhatsApp Phone Number *
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0">
                        <Phone size={15} className="text-muted" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 fw-semibold"
                        placeholder="e.g. +91 9876543210 (include country code)"
                        value={whatsappModal.phone}
                        onChange={(e) => setWhatsappModal({ ...whatsappModal, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Include country code (e.g. 91 for India, 1 for US)
                      </small>
                      {whatsappModal.phone && whatsappModal.phone.replace(/\D/g, '').length === 10 && (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style={{ fontSize: '0.72rem' }}>
                          Auto-formatted: +91 {whatsappModal.phone.replace(/\D/g, '')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Template Picker */}
                  {whatsappModal.templates.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-dark">
                        Choose Message Template
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={whatsappModal.selectedTemplateId}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                      >
                        {whatsappModal.templates.map(tpl => (
                          <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Message Body Editor */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label small fw-bold text-dark mb-0">
                        WhatsApp Message Body *
                      </label>
                      <small className="text-muted" style={{ fontSize: '0.725rem' }}>
                        Supports WhatsApp formatting (*bold*, _italic_, ~strikethrough~)
                      </small>
                    </div>
                    <textarea
                      rows="7"
                      className="form-control font-monospace"
                      style={{ fontSize: '0.85rem' }}
                      value={whatsappModal.message}
                      onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })}
                      required
                    />
                  </div>

                  {/* Attach Resume Checkbox */}
                  <div className="p-3 bg-white rounded-3 border">
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="attachResumeCheck"
                        checked={whatsappModal.attachResume}
                        onChange={(e) => setWhatsappModal({ ...whatsappModal, attachResume: e.target.checked })}
                      />
                      <label className="form-check-label small fw-semibold text-dark ms-1" htmlFor="attachResumeCheck">
                        <FileText size={15} className="me-1 text-primary" />
                        Attach active PDF Resume directly into the WhatsApp chat
                      </label>
                    </div>
                    {whatsappModal.attachResume && (
                      <div className="mt-2 ps-4">
                        {whatsappModal.resumes.length > 0 ? (
                          <select
                            className="form-select form-select-sm"
                            value={whatsappModal.selectedResumeId}
                            onChange={(e) => setWhatsappModal({ ...whatsappModal, selectedResumeId: e.target.value })}
                          >
                            {whatsappModal.resumes.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.original_filename} {r.is_active ? '(Active Resume)' : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <small className="text-warning">
                            No PDF resume uploaded yet. You can upload one in Resume Manager.
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-top p-3 bg-light d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-light border btn-sm px-3"
                    onClick={() => setWhatsappModal(prev => ({ ...prev, isOpen: false }))}
                    disabled={whatsappModal.sending}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-success btn-sm px-4 py-2 d-flex align-items-center gap-2 fw-semibold rounded-3 shadow-sm text-white"
                    style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                    disabled={whatsappModal.sending}
                  >
                    <Send size={15} />
                    <span>{whatsappModal.sending ? 'Sending to WhatsApp...' : 'Send Direct to WhatsApp'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
