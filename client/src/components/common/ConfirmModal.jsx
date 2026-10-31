import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title = 'Confirm Action', message, confirmText = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel, loading = false }) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(2px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 450 }}>
        <div className="modal-content border-0 rounded-4 shadow-lg p-3">
          <div className="modal-body text-center p-3">
            <div
              className={`mx-auto mb-3 d-flex align-items-center justify-content-center text-${confirmVariant}`}
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                backgroundColor: confirmVariant === 'danger' ? '#fee2e2' : '#dbeafe'
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <h5 className="fw-bold mb-2">{title}</h5>
            <p className="text-muted mb-4" style={{ fontSize: '0.925rem' }}>
              {message}
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                className="btn btn-light px-4 border"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant} px-4`}
                onClick={onConfirm}
                disabled={loading}
              >
                {loading ? 'Processing...' : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

