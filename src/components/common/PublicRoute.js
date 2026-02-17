import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = ({ children }) => {
    const { user, userRole } = useAuth();

    if (user) {
        // If user is logged in, redirect based on role
        if (userRole === 'admin') {
            return <Navigate to="/admin" replace />;
        }
        // Default for students/others
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PublicRoute;
