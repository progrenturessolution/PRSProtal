import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const location = useLocation();

  if (!token || !userRole) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
