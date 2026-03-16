import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Auth_Guard_Props {
    children: React.ReactNode;
}

export const F_Auth_Guard: React.FC<Auth_Guard_Props> = ({ children }) => {
    const location = useLocation();

    // Check for auth_token cookie
    const auth_token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='));

    if (!auth_token) {
        // Redirect to login while saving the attempted location
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};
