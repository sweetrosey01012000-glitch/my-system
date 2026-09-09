import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial' }}>
        Loading securely...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Debug - makikita mo sa console kung bakit na-block
  console.log("ProtectedRoute check:", { userRole, allowedRoles, isAllowed: allowedRoles?.includes(userRole) });

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.warn(`Access denied: ${userRole} not in`, allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;