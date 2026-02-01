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

                    <div className="menu-icon" onClick={toggleMenu}>
                        {isOpen ? <FaTimes /> : <FaBars />}
                    </div>

                    <ul className={isOpen ? "nav-menu active" : "nav-menu"}>
                        {userRole !== 'admin' && (
                            <li className="nav-item">
                                <Link to="/" className="nav-link" onClick={toggleMenu}>Home</Link>
                            </li>
                        )}

                        {/* New Courses Tab */}
                        <li className="nav-item">
                            <Link to="/courses" className="nav-link" onClick={toggleMenu}>Courses</Link>
                        </li>

                        {user ? (
                            <>
                                {userRole === 'admin' ? (
                                    <>
                                        <li className="nav-item">
                                            <Link to="/dashboard" className="nav-link" onClick={toggleMenu}>Dashboard</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/manage" className="nav-link" onClick={toggleMenu}>Manage</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/create" className="nav-link" onClick={toggleMenu}>Create</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/edit" className="nav-link" onClick={toggleMenu}>Edit</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/add-lesson" className="nav-link" onClick={toggleMenu}>Add Lesson</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/reports" className="nav-link" onClick={toggleMenu}>Reports</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/profile" className="nav-link" onClick={toggleMenu}>My Profile</Link>
                                        </li>
                                        <li className="nav-item">
                                            <div className="nav-link" onClick={() => { handleLogout(); toggleMenu(); }} style={{ cursor: 'pointer' }}>
                                                Logout
                                            </div>
                                        </li>
                                    </>
                                ) : userRole === 'teacher' ? (
                                    <>
                                        <li className="nav-item">
                                            <Link to="/dashboard" className="nav-link" onClick={toggleMenu}>Dashboard</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/edit" className="nav-link" onClick={toggleMenu}>My Courses</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/admin/add-lesson" className="nav-link" onClick={toggleMenu}>Add Lesson</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link to="/profile" className="nav-link" onClick={toggleMenu}>My Profile</Link>
                                        </li>
                                        <li className="nav-item">
                                            <div className="nav-link" onClick={() => { handleLogout(); toggleMenu(); }} style={{ cursor: 'pointer' }}>
                                                Logout
                                            </div>
                                        </li>
                                    </>
                                ) : (
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
                                            <Link to="/profile" className="dropdown-item" onClick={toggleMenu}>
                                                My Profile
                                            </Link>
                                            <Link to="/dashboard" className="dropdown-item" onClick={toggleMenu}>
                                                Dashboard
                                            </Link>
                                            <Link to="/change-password" className="dropdown-item" onClick={toggleMenu}>
                                                Change Password
                                            </Link>
                                            <div className="dropdown-item" onClick={() => { handleLogout(); toggleMenu(); }} style={{ cursor: 'pointer', borderTop: '1px solid #eee' }}>
                                                Logout
                                            </div>
                                        </div>
                                    </li>
                                )}
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link to="/login" className="nav-link" onClick={toggleMenu}>Login</Link>
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
