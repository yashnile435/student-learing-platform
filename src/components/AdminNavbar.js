import { Link, useLocation } from 'react-router-dom';
import '../styles/AdminNavbar.css';

const AdminNavbar = () => {
    return (
        <div className="admin-navbar">
            <AdminNavLink to="/admin/manage">Manage Courses</AdminNavLink>
            <AdminNavLink to="/admin/create">Create New</AdminNavLink>
            <AdminNavLink to="/admin/edit">Edit Course</AdminNavLink>
            <AdminNavLink to="/admin/add-lesson">Add Lesson</AdminNavLink>
            <AdminNavLink to="/admin/received-payments">Received Payments</AdminNavLink>
            <AdminNavLink to="/admin/reports">Reports</AdminNavLink>
        </div>
    );
};


const AdminNavLink = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to) || (to === '/admin/manage' && location.pathname === '/admin');

    return (
        <Link
            to={to}
            className={`admin-nav-item ${isActive ? 'active' : ''}`}
        >
            {children}
        </Link>
    );
};

export default AdminNavbar;
