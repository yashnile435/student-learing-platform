import { useState } from 'react';
import { FaBars, FaTimes, FaUserCircle, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const { user, logout, userRole, userData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Back Button Logic
    const isRootPage = ['/', '/login', '/signup', '/courses'].includes(location.pathname);
    // Exclude all dashboard routes as they have their own navigation/headers
    const isDashboard = location.pathname.startsWith('/dashboard');
    const showBackButton = !isRootPage && !isDashboard;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        setIsProfileOpen(false); // Close profile dropdown when menu toggles
    };

    const toggleProfileDropdown = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <>
            <nav className="navbar">
                <div className="container navbar-container">
                    <Link to="/" className="navbar-logo">
                        YaTi Learning
                    </Link>

                    {!isOpen && (
                        <div className="menu-icon" onClick={toggleMenu}>
                            <FaBars />
                        </div>
                    )}

                    {isOpen && (
                        <div className="sidebar-close-icon" onClick={toggleMenu}>
                            <FaTimes />
                        </div>
                    )}

                    <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
                        <li className="nav-item">
                            <Link
                                to="/"
                                className="nav-link"
                                onClick={toggleMenu}
                                style={location.pathname === '/' ? { color: 'var(--primary-color)', fontWeight: 'bolder' } : {}}
                            >
                                Home
                            </Link>
                        </li>

                        {/* New Courses Tab */}
                        <li className="nav-item">
                            <Link to="/courses" className="nav-link" onClick={toggleMenu}>Browse Courses</Link>
                        </li>
                        {!user && (
                            <li className="nav-item">
                                <span
                                    className="nav-link"
                                    onClick={() => {
                                        toggleMenu();
                                        if (location.pathname === '/') {
                                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                            navigate('/', { state: { scrollTo: 'contact' } });
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Contact
                                </span>
                            </li>
                        )}

                        {user ? (
                            <li className={`nav-item profile-dropdown-container ${isProfileOpen ? 'active' : ''}`}>
                                <div className="user-profile" onClick={toggleProfileDropdown}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaUserCircle className="user-icon" size={24} />
                                        <span className="user-name">{userData?.name || user.displayName || user.email?.split('@')[0]}</span>
                                    </div>
                                    <FaChevronDown
                                        style={{
                                            transition: 'transform 0.3s ease',
                                            transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                                        }}
                                        size={14}
                                    />
                                </div>
                                <div className={`dropdown-menu ${isProfileOpen ? 'show' : ''}`}>
                                    <Link to="/dashboard" className="dropdown-item" onClick={toggleMenu}>
                                        Dashboard
                                    </Link>
                                    <Link to="/profile" className="dropdown-item" onClick={toggleMenu}>
                                        My Profile
                                    </Link>
                                    <div className="dropdown-item" onClick={() => { handleLogout(); toggleMenu(); }} style={{ cursor: 'pointer', borderTop: '1px solid #eee', color: 'var(--danger-color)' }}>
                                        Logout
                                    </div>
                                </div>
                            </li>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link to="/login" className="nav-link" onClick={toggleMenu}>Log In</Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/signup" className="nav-link nav-link-btn" onClick={toggleMenu}>
                                        <span className="btn btn-primary">Sign Up</span>
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </nav>
            {/* Back Button displayed conditionally outside Navbar */}
            {showBackButton && (
                <div className="container" style={{ padding: '1rem 0' }}>
                    <div className="nav-back-btn" onClick={handleGoBack} style={{ display: 'inline-flex', paddingLeft: 0 }}>
                        <FaArrowLeft />
                        <span style={{ marginLeft: '0.5rem' }}>Back</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
