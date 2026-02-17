import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FaHome, FaBook, FaUsers, FaChartBar, FaPlus, FaSignOutAlt, FaUser, FaChalkboardTeacher, FaBars, FaTimes, FaEnvelope, FaTrash, FaEdit } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const DashboardLayout = () => {
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleContact = () => {
        navigate('/', { state: { scrollTo: 'contact' } });
        setMobileMenuOpen(false);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    const getNavItems = () => {
        if (userRole === 'admin') {
            return [
                { path: '/admin', icon: <FaHome />, label: 'Dashboard', end: true },
                { path: '/admin/edit', icon: <FaBook />, label: 'Manage Courses' },
                { path: '/admin/create', icon: <FaPlus />, label: 'Create Course' },
                { path: '/admin/manage-teachers', icon: <FaUsers />, label: 'Manage Teachers' },
                { path: '/admin/create-teacher', icon: <FaChalkboardTeacher />, label: 'Create Teacher' },
                { path: '/admin/received-payments', icon: <FaChartBar />, label: 'Received Payments' },
                { path: '/admin/reports', icon: <FaChartBar />, label: 'Reports' },
                { path: '/admin/delete-lessons', icon: <FaEdit />, label: 'Edit Lesson' },
                { path: '/profile', icon: <FaUser />, label: 'My Profile' },
            ];
        } else if (userRole === 'teacher') {
            return [
                { path: '/admin', icon: <FaHome />, label: 'Dashboard', end: true },
                { path: '/admin/edit', icon: <FaBook />, label: 'My Courses' },
                { path: '/admin/add-lesson', icon: <FaPlus />, label: 'Add Lesson' },
                { path: '/admin/delete-lessons', icon: <FaEdit />, label: 'Edit Lesson' },
                { path: '/profile', icon: <FaUser />, label: 'My Profile' },
            ];
        } else {
            return [
                { path: '/dashboard', icon: <FaHome />, label: 'My Learning' },
                { path: '/courses', icon: <FaBook />, label: 'Explore Courses' },
                { path: '/profile', icon: <FaUser />, label: 'My Profile' },
            ];
        }
    };

    const navItems = getNavItems();

    return (
        <div className="dashboard-layout">
            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${mobileMenuOpen ? 'active' : ''}`}
                onClick={closeMobileMenu}
            ></div>

            {/* Sidebar */}
            <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <h3>YaTi Learning</h3>
                    <button
                        className="sidebar-close-btn hide-desktop"
                        onClick={closeMobileMenu}
                        aria-label="Close menu"
                    >
                        <FaTimes />
                    </button>
                </div>
                <nav className="sidebar-nav">
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.end}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    onClick={closeMobileMenu}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Bottom Links */}
                    <div className="nav-item-bottom">
                        <button onClick={handleContact} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <FaEnvelope />
                            <span>Contact</span>
                        </button>
                        <button onClick={handleLogout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <FaSignOutAlt />
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="main-content">
                <header className="top-header">
                    {/* Mobile Menu Toggle Button (Inside Header) */}
                    <button
                        className="mobile-menu-toggle"
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Open menu"
                        style={{ marginRight: '1rem', padding: 0 }}
                    >
                        <FaBars />
                    </button>

                    <div style={{ flex: 1 }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Welcome, {user?.displayName || 'User'}</h2>
                        <span className="badge badge-free" style={{ marginTop: '0.25rem' }}>{userRole.toUpperCase()}</span>
                    </div>
                </header>
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};


export default DashboardLayout;
