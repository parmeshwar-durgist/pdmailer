import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CreateCampaign = () => {
  const navigate = useNavigate();

  // Wizard Step: 1 = Name & Contacts, 2 = Template & Resume, 3 = Preview & Test, 4 = Final Confirmation
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [subjectTemplate, setSubjectTemplate] = useState('Application for {{Title}} Position – {{Name}}');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  // Test Email
  const [testEmailAddress, setTestEmailAddress] = useState('durgistparmeshwar@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);

  // Submission
  const [launching, setLaunching] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Preselected contact IDs from Contacts page if available
  useEffect(() => {
    const preselected = sessionStorage.getItem('selected_campaign_contacts');
    if (preselected) {
      try {
        const ids = JSON.parse(preselected);
        if (Array.isArray(ids) && ids.length > 0) {
          setSelectedContactIds(ids);
          toast.success(`Loaded ${ids.length} preselected contacts.`);
        }
      } catch (e) {
        // ignore
      } finally {
        sessionStorage.removeItem('selected_campaign_contacts');
      }
    }
  }, []);

  // Fetch contacts, templates, resumes
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [contactsRes, templatesRes, resumesRes] = await Promise.all([
          api.get('/contacts', { params: { limit: 1000 } }),
          api.get('/templates'),
          api.get('/resumes')
        ]);

        const contactsList = contactsRes.data.data.contacts || [];
        setAllContacts(contactsList);

        if (selectedContactIds.length === 0 && contactsList.length > 0) {
          setSelectedContactIds(contactsList.map(c => c.id));
        }

        const tpls = templatesRes.data.data || [];
        setTemplates(tpls);
        if (tpls.length > 0) {
          setSelectedTemplateId(String(tpls[0].id));
          setSubjectTemplate(tpls[0].subject);
          setBodyTemplate(tpls[0].body);
        }

        const rlist = resumesRes.data.data || [];
        setResumes(rlist);
        const activeResume = rlist.find(r => r.is_active);
        if (activeResume) {
          setSelectedResumeId(String(activeResume.id));
        } else if (rlist.length > 0) {
          setSelectedResumeId(String(rlist[0].id));
        }
      } catch (err) {
        toast.error('Failed to load campaign dependencies.');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const handleTemplateChange = (e) => {
    const tplId = e.target.value;
    setSelectedTemplateId(tplId);
    const found = templates.find(t => String(t.id) === String(tplId));
    if (found) {
      setSubjectTemplate(found.subject);
      setBodyTemplate(found.body);
    }
  };

  const handleSelectAllContacts = () => {
    if (selectedContactIds.length === allContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(allContacts.map(c => c.id));
    }
  };

  const toggleContactSelection = (id) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter(x => x !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const getFirstSampleContact = () => {
    if (selectedContactIds.length > 0) {
      const match = allContacts.find(c => selectedContactIds.includes(c.id));
      if (match) return match;
    }
    return { name: 'Amit Sharma', title: 'React Developer', company: 'ABC Technologies', email: 'amit@example.com' };
  };

  const renderPersonalized = (text) => {
    if (!text) return '';
    const sample = getFirstSampleContact();
    return text
      .replace(/{{\s*name\s*}}/gi, sample.name)
      .replace(/{{\s*title\s*}}/gi, sample.title || 'Software Engineer')
      .replace(/{{\s*company\s*}}/gi, sample.company || 'your organization');
  };

  const handleSendTest = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter a test email address.');
      return;
    }
    setSendingTest(true);
    try {
      await api.post('/email/test', {
        recipient_email: testEmailAddress,
        subject: subjectTemplate,
        body: bodyTemplate,
        resume_id: selectedResumeId ? parseInt(selectedResumeId, 10) : null,
        contact_sample: getFirstSampleContact()
      });
      toast.success(`Test email sent successfully to ${testEmailAddress}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send test email. Check Gmail SMTP settings.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name.');
      setCurrentStep(1);
      return;
    }

    if (selectedContactIds.length === 0) {
      toast.error('Please select at least one recipient.');
      setCurrentStep(1);
      return;
    }

    setLaunching(true);
    try {
      const res = await api.post('/campaigns', {
        campaign_name: campaignName.trim(),
        template_id: selectedTemplateId ? parseInt(selectedTemplateId, 10) : null,
        resume_id: selectedResumeId ? parseInt(selectedResumeId, 10) : null,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        contact_ids: selectedContactIds
      });

      const newCampaign = res.data.data;
      await api.post(`/campaigns/${newCampaign.id}/start`);

      toast.success(`Campaign "${newCampaign.campaign_name}" launched successfully!`);
      navigate(`/campaigns/${newCampaign.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to launch campaign.');
    } finally {
      setLaunching(false);
    }
  };

  const selectedResumeObj = resumes.find(r => String(r.id) === String(selectedResumeId));

  if (loadingData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted mt-2 small">Loading campaign wizard...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 940 }} className="mx-auto">
      {/* Wizard Header */}
      <div className="mb-4 text-center">
        <h4 className="fw-extrabold text-dark mb-1">Create Job Application Campaign</h4>
        <p className="text-muted small">
          Queue individual personalized emails with your PDF resume attachment.
        </p>
      </div>

      {/* Responsive Step Progress Bar */}
      <div className="card-modern p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center">
          {[
            { step: 1, label: 'Recipients' },
            { step: 2, label: 'Email & Resume' },
            { step: 3, label: 'Preview & Test' },
            { step: 4, label: 'Confirm & Send' }
          ].map((s) => (
            <div
              key={s.step}
              className={`d-flex align-items-center gap-2 ${currentStep === s.step ? 'text-primary fw-bold' : currentStep > s.step ? 'text-success fw-semibold' : 'text-muted'}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setCurrentStep(s.step)}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center text-white ${
                  currentStep === s.step ? 'bg-primary' : currentStep > s.step ? 'bg-success' : 'bg-secondary bg-opacity-50'
                }`}
                style={{ width: 28, height: 28, fontSize: '0.8rem', fontWeight: 700 }}
              >
                {currentStep > s.step ? '✓' : s.step}
              </div>
              <span className="small d-none d-md-inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Campaign Name & Contact Selection */}
      {currentStep === 1 && (
        <div className="card-modern p-3 p-sm-4 mb-4">
          <h5 className="fw-bold mb-3">Step 1: Campaign Name & Recipients</h5>
          
          <div className="mb-4">
            <label className="form-label small fw-semibold">Campaign Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Software Engineer Application – Batch 1"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="fw-bold mb-0">Select HR Contacts</h6>
              <small className="text-muted">
                {selectedContactIds.length} of {allContacts.length} contacts selected
              </small>
            </div>
            <button
              type="button"
              className="btn btn-light btn-sm rounded-3 border"
              onClick={handleSelectAllContacts}
            >
              {selectedContactIds.length === allContacts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="table-responsive border rounded-3" style={{ maxHeight: 300 }}>
            <table className="table table-modern table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Name & Role</th>
                  <th>Company</th>
                </tr>
              </thead>
              <tbody>
                {allContacts.map((contact) => {
                  const isChecked = selectedContactIds.includes(contact.id);
                  return (
                    <tr
                      key={contact.id}
                      className={isChecked ? 'table-primary bg-opacity-10' : ''}
                      onClick={() => toggleContactSelection(contact.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isChecked}
                          onChange={() => {}}
                        />
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{contact.name}</div>
                        <small className="text-muted">{contact.email}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {contact.company || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-4 shadow-sm"
              onClick={() => {
                if (!campaignName.trim()) {
                  toast.error('Please enter a campaign name');
                  return;
                }
                if (selectedContactIds.length === 0) {
                  toast.error('Please select at least one contact');
                  return;
                }
                setCurrentStep(2);
              }}
            >
              Next Step <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Email Content & Resume Selection */}
      {currentStep === 2 && (
        <div className="card-modern p-3 p-sm-4 mb-4">
          <h5 className="fw-bold mb-3">Step 2: Email Content & Resume</h5>

          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Load Saved Template</label>
              <select
                className="form-select"
                value={selectedTemplateId}
                onChange={handleTemplateChange}
              >
                <option value="">-- Custom Message (No Template) --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Resume PDF Attachment *</label>
              <select
                className="form-select"
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.original_filename} {r.is_active ? '(Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Email Subject *</label>
            <input
              type="text"
              className="form-control font-monospace"
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold mb-0">Email Body (HTML formatted) *</label>
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-decoration-none small text-primary fw-semibold"
                onClick={() => {
                  if (templates.length > 0) {
                    setSubjectTemplate(templates[0].subject);
                    setBodyTemplate(templates[0].body);
                    toast.success('Loaded professional executive format!');
                  }
                }}
              >
                ✨ Load Executive HR Format
              </button>
            </div>
            <textarea
              rows={9}
              className="form-control font-monospace small"
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              required
            />
          </div>

          <div className="d-flex justify-content-between">
            <button
              className="btn btn-light border d-flex align-items-center gap-1 rounded-3"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-4 shadow-sm"
              onClick={() => {
                if (!subjectTemplate.trim() || !bodyTemplate.trim()) {
                  toast.error('Subject and body cannot be empty.');
                  return;
                }
                setCurrentStep(3);
              }}
            >
              Preview & Test <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Personalization Preview & Send Test Email */}
      {currentStep === 3 && (
        <div className="card-modern p-3 p-sm-4 mb-4">
          <h5 className="fw-bold mb-3">Step 3: Preview Personalization</h5>

          <div className="border rounded-3 p-3 p-sm-4 mb-4 bg-white shadow-sm">
            <div className="border-bottom pb-2 mb-3">
              <div className="text-muted small">Rendered Subject:</div>
              <h6 className="fw-bold text-dark mb-0">{renderPersonalized(subjectTemplate)}</h6>
            </div>
            <div
              className="rendered-body small"
              dangerouslySetInnerHTML={{ __html: renderPersonalized(bodyTemplate) }}
            />
            <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2 text-muted small">
              <FileText size={16} className="text-danger" />
              <span>Attached: <strong>{selectedResumeObj?.original_filename || 'Resume.pdf'}</strong></span>
            </div>
          </div>

          {/* Test Email Box */}
          <div className="p-3 bg-light rounded-3 border mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Sparkles className="text-primary" size={16} />
              <span className="fw-bold small text-dark">Send Instant Test to Yourself</span>
            </div>
            <div className="input-group">
              <input
                type="email"
                className="form-control form-control-sm"
                placeholder="parmeshwardurgist@gmail.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSendTest}
                disabled={sendingTest}
              >
                {sendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between">
            <button
              className="btn btn-light border d-flex align-items-center gap-1 rounded-3"
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              className="btn btn-primary d-flex align-items-center gap-1 rounded-3 px-4 shadow-sm"
              onClick={() => setCurrentStep(4)}
            >
              Review & Launch <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Final Confirmation */}
      {currentStep === 4 && (
        <div className="card-modern p-3 p-sm-4 mb-4">
          <div className="text-center mb-4">
            <div className="mx-auto mb-3 bg-primary-subtle text-primary p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
              <Send size={26} />
            </div>
            <h4 className="fw-extrabold text-dark mb-1">Confirm Campaign Launch</h4>
            <p className="text-muted small">
              You are ready to dispatch individual personalized emails.
            </p>
          </div>

          <div className="card p-3 mb-4 bg-light border-0 rounded-3">
            <div className="row g-2">
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Campaign:</span>
                <div className="fw-bold text-dark">{campaignName}</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Recipients:</span>
                <div className="fw-bold text-primary">{selectedContactIds.length} Individual Emails</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Sender:</span>
                <div className="fw-semibold text-dark">parmeshwardurgist@gmail.com</div>
              </div>
              <div className="col-12 col-sm-6">
                <span className="text-muted small">Attached Resume:</span>
                <div className="fw-semibold text-dark">{selectedResumeObj?.original_filename || 'Default'}</div>
              </div>
            </div>
          </div>

          <div className="alert alert-info py-2 px-3 small rounded-3 mb-4 d-flex align-items-center gap-2">
            <ShieldAlert size={18} className="flex-shrink-0 text-primary" />
            <div>
              Emails will be sent 1:1 with sequential rate-limiting delays to respect Gmail limits.
            </div>
          </div>

          <div className="d-flex justify-content-between">
            <button
              className="btn btn-light border d-flex align-items-center gap-1 rounded-3"
              onClick={() => setCurrentStep(3)}
              disabled={launching}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              className="btn btn-success d-flex align-items-center gap-2 rounded-3 px-4 py-2 shadow fw-bold"
              onClick={handleLaunchCampaign}
              disabled={launching}
            >
              {launching ? (
                <>
                  <span className="spinner-border spinner-border-sm" />
                  Starting Queue...
                </>
              ) : (
                <>
                  <Send size={16} /> Launch {selectedContactIds.length} Emails
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCampaign;
