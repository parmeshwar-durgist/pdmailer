import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ImportContacts from './pages/ImportContacts';
import ResumeManager from './pages/ResumeManager';
import EmailTemplates from './pages/EmailTemplates';
import CreateCampaign from './pages/CreateCampaign';
import CampaignProgress from './pages/CampaignProgress';
import CampaignHistory from './pages/CampaignHistory';
import EmailLogs from './pages/EmailLogs';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading application...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading application...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const SmtpRequiredRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Checking configuration...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '0.875rem'
          }
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="contacts"
              element={
                <SmtpRequiredRoute>
                  <Contacts />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="import"
              element={
                <SmtpRequiredRoute>
                  <ImportContacts />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="resumes"
              element={
                <SmtpRequiredRoute>
                  <ResumeManager />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="templates"
              element={
                <SmtpRequiredRoute>
                  <EmailTemplates />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="campaigns/new"
              element={
                <SmtpRequiredRoute>
                  <CreateCampaign />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="campaigns/:id"
              element={
                <SmtpRequiredRoute>
                  <CampaignProgress />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="campaigns"
              element={
                <SmtpRequiredRoute>
                  <CampaignHistory />
                </SmtpRequiredRoute>
              }
            />
            <Route
              path="logs"
              element={
                <SmtpRequiredRoute>
                  <EmailLogs />
                </SmtpRequiredRoute>
              }
            />
            <Route path="settings" element={<Settings />} />
            <Route
              path="admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

