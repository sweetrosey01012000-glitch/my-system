import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading securely...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // NORMALIZE: staff -> MSWD Staff para di na mag-error
  const normalizedRole = userRole === 'staff' ? 'MSWD Staff' : userRole;
  const normalizedAllowed = allowedRoles?.map(r => r === 'staff' ? 'MSWD Staff' : r);

  if (allowedRoles && !normalizedAllowed.includes(normalizedRole)) {
    console.warn(`Blocked: ${userRole} not allowed`);
    return <Navigate to="/" replace />; // Stay sa homepage, hindi na sa /unauthorized
  }

  return children;
};

export default ProtectedRoute;