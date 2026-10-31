import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Key, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';

const SmtpSetupModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToSettings = () => {
    onClose();
    navigate('/settings');
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(9, 14, 26, 0.8)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        zIndex: 1060
      }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 540 }}>
        <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden">
          {/* Header Banner */}
          <div
            className="p-4 text-white text-center position-relative"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)'
            }}
          >
            <button
              type="button"
              className="btn-close btn-close-white position-absolute top-0 end-0 m-3"
              onClick={onClose}
              aria-label="Close"
            />
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center text-white rounded-circle shadow-lg"
              style={{
                width: 64,
                height: 64,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              <Key size={30} className="text-warning" />
            </div>

            <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill mb-2" style={{ backgroundColor: 'rgba(255, 255, 255, 0.18)', fontSize: '0.75rem', fontWeight: 700 }}>
              <Sparkles size={13} /> STEP 1 OF 1: SMTP ACTIVATION
            </div>

            <h4 className="fw-bold mb-1">Set Up Your Gmail SMTP First</h4>
            <p className="text-white text-opacity-80 small mb-0">
              Connect your Gmail account to unlock all portal features
            </p>
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-white">
            <div className="alert alert-primary bg-primary bg-opacity-10 border-0 rounded-3 p-3 mb-3 text-dark small">
              <div className="fw-bold mb-1 d-flex align-items-center gap-1.5 text-primary">
                <Lock size={15} /> All Features Are Currently Locked
              </div>
              <div>
                To ensure all emails are sent directly and authentically from your personal Gmail address, you must configure your <strong>Google App Password</strong> in Settings.
              </div>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold text-dark mb-2 small text-uppercase" style={{ letterSpacing: '0.04em' }}>
                Quick 3-Step Setup Guide:
              </h6>
              
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex align-items-start gap-2.5 p-2 rounded-3 bg-light border">
                  <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>1</span>
                  <div>
                    <div className="fw-semibold text-dark">Turn on 2-Step Verification</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Ensure 2-Step Verification is enabled on your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-primary text-decoration-underline">Google Security Page <ExternalLink size={10} /></a>.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5 p-2 rounded-3 bg-light border">
                  <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>2</span>
                  <div>
                    <div className="fw-semibold text-dark">Generate an App Password</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      In Google Security, create an App Password named <code>HR Bulk Mailer</code> to receive a 16-character code.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5 p-2 rounded-3 bg-light border">
                  <span className="badge bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: 22, height: 22, fontSize: '0.75rem' }}>3</span>
                  <div>
                    <div className="fw-semibold text-dark">Save & Test Connection in Settings</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Paste the code in <strong>Settings</strong> and click <strong>Test SMTP Connection</strong>.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-3 border d-flex align-items-center gap-2 bg-success bg-opacity-10 text-success small">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span>
                <strong>Instant Unlock:</strong> Contacts, Excel Import, Templates, Resume Uploads, and Campaigns unlock the moment your test succeeds!
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-top p-3 bg-light d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-light btn-sm text-muted px-3 border"
              onClick={onClose}
            >
              Dismiss for Now
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm px-4 py-2 d-flex align-items-center gap-2 fw-semibold rounded-3 shadow-sm"
              onClick={handleGoToSettings}
            >
              <span>Go to Settings & Set Up SMTP</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpSetupModal;

