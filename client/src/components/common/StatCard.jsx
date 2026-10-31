import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '#2563eb', bg = '#eff6ff', subtitle }) => {
  return (
    <div className="card-modern p-3 p-sm-4 h-100 position-relative">
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="overflow-hidden">
          <span
            className="text-muted text-uppercase fw-bold text-truncate d-block"
            style={{ fontSize: '0.7rem', letterSpacing: '0.06em' }}
          >
            {title}
          </span>
          <h3
            className="fw-extrabold mt-1 mb-0"
            style={{ color: '#0f172a', fontSize: '1.75rem', letterSpacing: '-0.03em' }}
          >
            {value !== undefined && value !== null ? Number(value).toLocaleString() : '—'}
          </h3>
          {subtitle && (
            <small
              className="text-muted mt-1 d-block text-truncate"
              style={{ fontSize: '0.75rem' }}
            >
              {subtitle}
            </small>
          )}
        </div>
        <div
          className="shadow-sm flex-shrink-0 d-flex align-items-center justify-content-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: bg,
            color: color
          }}
        >
          {Icon && <Icon size={24} />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
