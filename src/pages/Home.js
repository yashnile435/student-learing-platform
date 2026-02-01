
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaChalkboardTeacher, FaRocket, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import '../index.css';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={{ background: 'var(--bg-body)', minHeight: '100vh', overflow: 'hidden' }}>

            {/* Hero Section */}
            <section style={{
                position: 'relative',
                padding: 'clamp(4rem, 10vw, 8rem) 1rem clamp(3rem, 8vw, 6rem)',
                textAlign: 'center',
                background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f5f3ff 100%)'
            }}>
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <span style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary-color)',
                        padding: '0.5rem 1rem',
                        borderRadius: '50px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'inline-block',
                        marginBottom: '1.5rem'
                    }}>
                        🚀 Start Learning Today
                    </span>
                    <h1 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, #4c1d95 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '1.5rem',
                        lineHeight: 1.2
                    }}>
                        Master Your Future <br /> with YaTi Learning
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                        color: 'var(--text-muted)',
                        maxWidth: '700px',
                        margin: '0 auto 2.5rem',
                        lineHeight: 1.6,
                        padding: '0 1rem'
                    }}>
                        The ultimate platform for modern education. Access world-class courses, expert mentors, and hands-on projects to launch your career.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-primary"
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                boxShadow: 'var(--shadow-purple)',
                                borderRadius: '50px'
                            }}
                            onClick={() => navigate('/courses')}
                        >
                            Explore Courses
                        </button>
                        <button
                            className="btn btn-secondary"
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                borderRadius: '50px',
                                background: 'white',
                                color: 'var(--primary-color)',
                                borderColor: 'var(--border-color)'
                            }}
                            onClick={() => navigate('/signup')}
                        >
                            Get Started
                        </button>
                    </div>
                </div>

                {/* Decorative Blobs */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-5%',
                    width: '400px',
                    height: '400px',
                    background: 'var(--primary-light)',
                    filter: 'blur(100px)',
                    opacity: 0.5,
                    zIndex: 0
                }}></div>
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '-5%',
                    width: '300px',
                    height: '300px',
                    background: '#fbcfe8',
                    filter: 'blur(80px)',
                    opacity: 0.5,
                    zIndex: 0
                }}></div>
            </section>

            {/* Why Choose Us */}
            <section style={{ padding: 'clamp(4rem, 8vw, 6rem) 1rem', background: 'white' }}>
                <div className="container">
                    <div className="text-center mb-4">
                        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', color: 'var(--primary-color)', marginBottom: '1rem' }}>Why Learners Choose YaTi</h2>
                        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-muted)' }}>We don't just teach, we transform careers.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                        marginTop: '3rem'
                    }}>
                        <div className="feature-card">
                            <div className="feature-icon-wrapper" style={{ background: 'var(--bg-body)', color: 'var(--primary-color)' }}>
                                <FaChalkboardTeacher />
                            </div>
                            <h3>Expert Instructors</h3>
                            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                                Learn from industry leaders who have experience building scalable applications at top tech companies.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper" style={{ background: '#ecfdf5', color: 'var(--success-color)' }}>
                                <FaRocket />
                            </div>
                            <h3>Practical Projects</h3>
                            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                                Skip the theory. Build real-world projects that you can add to your portfolio and show to recruiters.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon-wrapper" style={{ background: '#fffbeb', color: 'var(--warning-color)' }}>
                                <FaGraduationCap />
                            </div>
                            <h3>Certification</h3>
                            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                                Earn recognized certificates upon completion to validate your skills and boost your LinkedIn profile.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Popular Courses Preview */}
            <section style={{ padding: 'clamp(4rem, 8vw, 6rem) 1rem', background: 'var(--bg-body)' }}>
                <div className="container flex flex-col items-center">
                    <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', marginBottom: '3rem', textAlign: 'center' }}>Start Your Journey</h2>

                    {/* Placeholder for visual balance - In real app, could map a few courses */}
                    <div style={{
                        background: 'white',
                        padding: '3rem',
                        borderRadius: '2rem',
                        boxShadow: 'var(--shadow-md)',
                        maxWidth: '900px',
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Ready to dive in?</h3>
                        <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
                            Browse our catalog of premium and free courses covering everything from Web Development to AI.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '1rem 2rem', borderRadius: '50px' }}
                            onClick={() => navigate('/courses')}
                        >
                            View All Courses <FaArrowRight style={{ marginLeft: '10px' }} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer - Minimal */}
            <footer id="footer" style={{ background: 'white', padding: 'clamp(2rem, 5vw, 4rem) 1rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>YaTi Learning</h2>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 'clamp(1rem, 3vw, 2rem)',
                        marginBottom: '2rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ cursor: 'pointer' }}>About Us</span>
                        <span style={{ cursor: 'pointer' }}>Careers</span>
                        <span style={{ cursor: 'pointer' }}>Blog</span>
                        <span style={{ cursor: 'pointer' }}>Contact</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>&copy; {new Date().getFullYear()} YaTi Learning. Built with ❤️.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
