import React from 'react';
import { CheckCircle2, XCircle, Clock, Loader, AlertCircle, Slash, FileText } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'sent':
      return (
        <span className="badge-status badge-sent">
          <CheckCircle2 size={13} /> Sent
        </span>
      );
    case 'failed':
      return (
        <span className="badge-status badge-failed">
          <XCircle size={13} /> Failed
        </span>
      );
    case 'pending':
      return (
        <span className="badge-status badge-pending">
          <Clock size={13} /> Pending
        </span>
      );
    case 'processing':
      return (
        <span className="badge-status badge-processing">
          <Loader size={13} className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} /> Sending
        </span>
      );
    case 'skipped':
      return (
        <span className="badge-status badge-skipped">
          <Slash size={13} /> Skipped
        </span>
      );
    case 'cancelled':
      return (
        <span className="badge-status badge-cancelled">
          <AlertCircle size={13} /> Cancelled
        </span>
      );
    case 'completed':
      return (
        <span className="badge-status badge-completed">
          <CheckCircle2 size={13} /> Completed
        </span>
      );
    case 'draft':
      return (
        <span className="badge-status badge-skipped">
          <FileText size={13} /> Draft
        </span>
      );
    default:
      return (
        <span className="badge-status badge-skipped">
          {status || 'Unknown'}
        </span>
      );
  }
};

export default StatusBadge;

