import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="text-center py-5">
      <div className="mx-auto mb-3 bg-light text-muted p-4 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 80, height: 80 }}>
        <AlertCircle size={40} />
      </div>
      <h2 className="fw-bold text-dark">404 - Page Not Found</h2>
      <p className="text-muted mb-4">
        The requested page does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary d-inline-flex align-items-center gap-2 rounded-3 px-4">
        <Home size={16} /> Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;

