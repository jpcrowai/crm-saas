import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole === 'master' && user?.role_global !== 'master') {
    return <Navigate to="/" />; // Or unauthorized page
  }

  // Checking for tenant access could be added here if needed

  return children;
};

export default PrivateRoute;
