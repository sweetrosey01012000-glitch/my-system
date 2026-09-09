import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

const globalStyles = ` * { box-sizing: border-box; } html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow-x: hidden; } .glass-panel { background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07); } .anim-slide-up { animation: slideUp 0.6s ease-out forwards; } .anim-fade-in { animation: fadeIn 0.8s ease-out forwards; } .hover-card { transition: transform 0.3s ease, box-shadow 0.3s ease; } .hover-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); } .hover-btn { transition: all 0.2s ease; } .hover-btn:active { transform: scale(0.95); } .hover-btn:hover { filter: brightness(1.1); } @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } `;

const UnauthorizedPage = () => {
  const styles = { body: { fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }, card: { background: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '420px', borderTop: '6px solid #dc2626' }, icon: { fontSize: '48px', margin: '0 0 15px 0' }, title: { color: '#1e3a8a', fontSize: '24px', fontWeight: '900', margin: '0 0 10px 0' }, text: { color: '#64748b', fontSize: '15px', marginBottom: '25px', lineHeight: '1.5' }, button: { background: '#fbbf24', color: '#1e3a8a', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' } };
  return ( <div style={styles.body}><div style={styles.card}><div style={styles.icon}>🛑</div><h2 style={styles.title}>Access Denied or Not Found</h2><p style={styles.text}>The page you are looking for does not exist, or you do not have the required permissions to view it.</p><Link to="/" style={styles.button}>Return to Home</Link></div></div> );
};

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

          {/* Protected Dashboards */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPage /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'admin']}><StaffPage /></ProtectedRoute>} />
          <Route path="/soloparent" element={<ProtectedRoute allowedRoles={['soloparent']}><SoloParentPage /></ProtectedRoute>} />

          {/* Protected Staff/Admin Features */}
          <Route path="/pending-registrations" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'admin']}><PendingRegistrationsPage /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'admin']}><ClaimsTrackingPage /></ProtectedRoute>} />

          {/* Protected Solo Parent Features */}
          <Route path="/status" element={<ProtectedRoute allowedRoles={['soloparent']}><ApplicationStatusPage /></ProtectedRoute>} />

          {/* Shared Protected Features - AYOS NA TO */}
          <Route path="/announcements" element={<ProtectedRoute allowedRoles={['admin', 'MSWD Staff', 'soloparent']}><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/forum" element={<ProtectedRoute allowedRoles={['admin', 'MSWD Staff', 'soloparent']}><ForumPage /></ProtectedRoute>} />
          
          {/* MESSAGE - ISANG ROUTE LANG PERO GUMAGANA SA LAHAT */}
          <Route path="/messages" element={<ProtectedRoute allowedRoles={['MSWD Staff', 'soloparent']}><MessagesPage /></ProtectedRoute>} />
          
          {/* Extra aliases para hindi ka malito - parehong MessagesPage pa rin */}
          <Route path="/soloparent/messages" element={<ProtectedRoute allowedRoles={['soloparent']}><MessagesPage /></ProtectedRoute>} />
          <Route path="/staff/messages" element={<ProtectedRoute allowedRoles={['MSWD Staff']}><MessagesPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<UnauthorizedPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;