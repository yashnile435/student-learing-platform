import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { FaBars, FaTimes, FaUser } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const PublicLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user } = useAuth(); // Get user from AuthContext

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
                    <Link to="/courses" style={{ fontWeight: 500 }}>Browse Courses</Link>
                    {user ? (
                        <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                    ) : (
                        <>
                            <Link to="/login" style={{ fontWeight: 500 }}>Login</Link>
                            <Link to="/signup" className="btn btn-primary">Get Started</Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
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
                        background: 'white',
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1rem'
                    }} className="show-mobile">
                        {/* Mobile Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', height: 'var(--header-height)' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                YaTi Learning
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Menu Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)', padding: '0.5rem 0' }}>Home</Link>
                            <Link to="/courses" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--primary-color)', padding: '0.5rem 0', borderBottom: '2px solid var(--primary-color)', width: 'fit-content' }}>Courses</Link>
                            <div onClick={() => {
                                setMobileMenuOpen(false);
                                document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
                            }} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)', padding: '0.5rem 0', cursor: 'pointer' }}>Contact</div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto', paddingBottom: '2rem' }}>
                            {user ? (
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    padding: '1rem',
                                    fontSize: '1.1rem',
                                    borderRadius: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <FaUser /> Go to Dashboard
                                </Link>
                            ) : (
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{
                                    width: '100%',
                                    textAlign: 'center',
                                    padding: '1rem',
                                    fontSize: '1.1rem',
                                    borderRadius: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}>
                                    <FaUser /> Login
                                </Link>
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
