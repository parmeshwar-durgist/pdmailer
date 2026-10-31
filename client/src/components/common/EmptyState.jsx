import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ title = 'No data found', description = 'Get started by creating or importing records.', icon: Icon = Inbox, action }) => {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="mx-auto mb-3 d-flex align-items-center justify-content-center"
        style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b' }}
      >
        <Icon size={32} />
      </div>
      <h5 className="fw-semibold text-dark mb-1">{title}</h5>
      <p className="text-muted mx-auto mb-3" style={{ maxWidth: 420, fontSize: '0.9rem' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;

