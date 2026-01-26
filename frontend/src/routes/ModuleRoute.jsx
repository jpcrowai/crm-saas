import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ModuleRoute = ({ children, module }) => {
    const { user, loading } = useAuth();

    if (loading) return null;

    // Master always has access or we are in master context
    if (user?.role_global === 'master' && !user?.tenant_slug) return children;

    const habilitados = user?.modulos_habilitados || [];

    if (habilitados.includes(module)) {
        return children;
    }

    return <Navigate to="/" replace />;
};

export default ModuleRoute;
