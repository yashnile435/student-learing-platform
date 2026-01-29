
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roleRequired }) => {
    const { user, userRole, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (roleRequired && userRole !== roleRequired) {
        // Redirect based on their ACTUAL role
        if (userRole === 'admin') {
            return <Navigate to="/admin" />;
        }
        return <Navigate to="/dashboard" />;
    }

    return children;
};

export default PrivateRoute;
