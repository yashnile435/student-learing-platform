import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const PublicLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth(); // Get user from AuthContext
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <nav style={{
                height: 'var(--header-height)',
                background: 'white',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 2rem',
                justifyContent: 'space-between',
                position: 'relative'
            }}>
                <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                    <Link to="/">YaTi Learning</Link>
                </div>

                {/* Desktop Menu */}
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }} className="hide-mobile">
                    <Link
                        to="/"
                        style={{
                            fontWeight: 500,
                            color: location.pathname === '/' ? 'var(--primary-color)' : 'inherit',
                            fontWeight: location.pathname === '/' ? '700' : '500'
                        }}
                    >
                        Home
                    </Link>
                    <Link to="/courses" style={{ fontWeight: 500 }}>Browse Courses</Link>
                    {!user && (
                        <span
                            onClick={() => {
                                if (location.pathname === '/') {
                                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    navigate('/', { state: { scrollTo: 'contact' } });
                                }
                            }}
                            style={{ fontWeight: 500, cursor: 'pointer' }}
                        >
                            Contact
                        </span>
                    )}
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                    ) : (
                        <>
                            {location.pathname !== '/login' && (
                                <Link to="/login" style={{ fontWeight: 500 }}>Login</Link>
                            )}
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button type="button"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        display: 'none',
                        background: 'transparent',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: 'var(--primary-color)'
                    }}
                    className="show-mobile"
                >
                    {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1.5rem'
                    }} className="show-mobile">
                        {/* Mobile Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary-color)' }} onClick={() => setMobileMenuOpen(false)}>
                                <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>YaTi Learning</Link>
                            </div>
                            <button type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.8rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                            <Link
                                to="/"
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: location.pathname === '/' ? 700 : 500,
                                    color: location.pathname === '/' ? 'var(--primary-color)' : 'var(--text-main)',
                                    textDecoration: 'none'
                                }}
                            >
                                Home
                            </Link>
                            <Link
                                to="/courses"
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    fontSize: '1.25rem',
                                    fontWeight: location.pathname === '/courses' ? 700 : 500,
                                    color: location.pathname === '/courses' ? 'var(--primary-color)' : 'var(--text-main)',
                                    textDecoration: 'none'
                                }}
                            >
                                Browse Courses
                            </Link>
                            {!user && (
                                <div
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        if (location.pathname === '/') {
                                            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                            navigate('/', { state: { scrollTo: 'contact' } });
                                        }
                                    }}
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 500,
                                        color: 'var(--text-main)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Contact
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: '3rem', padding: '0 1rem' }}>
                            {user ? (
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    padding: '1rem',
                                    fontSize: '1.1rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)'
                                }}>
                                    <FaUser /> Go to Dashboard
                                </Link>
                            ) : (
                                location.pathname !== '/login' && (
                                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        padding: '1rem',
                                        fontSize: '1.1rem',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)'
                                    }}>
                                        <FaUser /> Login
                                    </Link>
                                )
                            )}
                        </div>
                    </div>
                )}
            </nav>
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
        </div>
    );
};

export default PublicLayout;
