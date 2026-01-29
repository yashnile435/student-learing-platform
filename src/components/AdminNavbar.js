import { Link, useLocation } from 'react-router-dom';
import '../styles/AdminNavbar.css';

const AdminNavbar = () => {
    // We rely on Recat Router's "NavLink" for active styling usually, 
    // but here checks current path. simpler to use NavLink.
    // However, I'll stick to the existing CSS class logic by checking location.
    
    // Actually, NavLink is better for "active" class.
    /*
    const tabs = [
        { path: '/admin/manage', label: 'Manage Courses' },
        { path: '/admin/create', label: 'Create New' },
        { path: '/admin/edit', label: 'Edit Course' },
        { path: '/admin/add-lesson', label: 'Add Lesson' },
        { path: '/admin/reports', label: 'Reports' },
    ];
    */
   
   // Retaining pure CSS names.
   return (
       <div className="admin-navbar">
           <AdminNavLink to="/admin/manage">Manage Courses</AdminNavLink>
           <AdminNavLink to="/admin/create">Create New</AdminNavLink>
           <AdminNavLink to="/admin/edit">Edit Course</AdminNavLink>
           <AdminNavLink to="/admin/add-lesson">Add Lesson</AdminNavLink>
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
