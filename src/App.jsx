import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import LandingPage from './pages/views/LandingPage';
import LoginPage from './pages/views/LoginPage';
import PublicRegisterPage from './pages/views/PublicRegisterPage';
import CategoriesPage from './pages/views/CategoriesPage';

// Protected Dashboards
import AdminPage from './pages/admin/AdminPage';
import StaffPage from './pages/staff/StaffPage';
import SoloParentPage from './pages/soloparent/SoloParentPage';

// Protected Staff/Admin Features
import PendingRegistrationsPage from './pages/staff/PendingRegistrationsPage';
import ClaimsTrackingPage from './pages/staff/ClaimsTrackingPage';

// Protected Solo Parent Features
import ApplicationStatusPage from './pages/soloparent/ApplicationStatusPage';

// Shared Protected Features
import AnnouncementsPage from './pages/shared/AnnouncementsPage';
import ForumPage from './pages/shared/ForumPage';
import MessagesPage from './pages/shared/MessagesPage';

const globalStyles = `
    * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; }
  .glass-panel {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
  }
`;

function App() {
  return (
    <AuthProvider>
      <Router>
        <style>{globalStyles}</style>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<PublicRegisterPage />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          {/* Protected Dashboards */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'admin']}><StaffPage /></ProtectedRoute>} />
          <Route path="/soloparent" element={<ProtectedRoute allowedRoles={['soloparent']}><SoloParentPage /></ProtectedRoute>} />

          {/* Protected Staff/Admin Features */}
          <Route path="/pending-registrations" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'admin']}><PendingRegistrationsPage /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'admin']}><ClaimsTrackingPage /></ProtectedRoute>} />

          {/* Protected Solo Parent Features */}
          <Route path="/status" element={<ProtectedRoute allowedRoles={['soloparent']}><ApplicationStatusPage /></ProtectedRoute>} />

          {/* Shared Protected Features */}
          <Route path="/announcements" element={<ProtectedRoute allowedRoles={['admin', 'MSWD Staff', 'soloparent']}><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/forum" element={<ProtectedRoute allowedRoles={['admin', 'MSWD Staff', 'soloparent']}><ForumPage /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'soloparent']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/soloparent/messages" element={<ProtectedRoute allowedRoles={['soloparent']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/staff/messages" element={<ProtectedRoute allowedRoles={['MSWD Staff']}><MessagesPage /></ProtectedRoute>} />

          <Route path="/unauthorized" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;