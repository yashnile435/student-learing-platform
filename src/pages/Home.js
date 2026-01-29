
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = (e) => {
        e.preventDefault();
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/signup');
        }
    };

    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container hero-content">
                    <h1>Master Your Future with YaTi Learning</h1>
                    <p className="hero-subtitle">
                        Expert-led courses, comprehensive notes, and a community of learners.
                        Start your journey today.
                    </p>
                    <div className="hero-cta">
                        <button onClick={handleGetStarted} className="btn btn-cta btn-lg">Get Started Free</button>
                        <Link to="/courses" className="btn btn-secondary btn-lg">Explore Courses</Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Why Choose YaTi?</h2>
                    <div className="features-grid">
                        <div className="feature-card card">
                            <div className="feature-icon">🎓</div>
                            <h3>Expert Instructors</h3>
                            <p>Learn from industry veterans with years of real-world experience.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">📚</div>
                            <h3>Comprehensive Notes</h3>
                            <p>Get access to detailed study materials and resources for every lesson.</p>
                        </div>
                        <div className="feature-card card">
                            <div className="feature-icon">🚀</div>
                            <h3>Career Growth</h3>
                            <p>Build a portfolio and gain skills that top employers are looking for.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="pricing-section">
                <div className="container">
                    <h2 className="section-title">Simple Pricing</h2>
                    <div className="pricing-grid">
                        <div className="pricing-card card">
                            <h3>Basic Plan</h3>
                            <p className="price">Free</p>
                            <ul className="pricing-features">
                                <li>✅ Access to 3 Intro Videos</li>
                                <li>❌ Course Notes</li>
                                <li>❌ Certificate</li>
                                <li>❌ Support</li>
                            </ul>
                            <button onClick={handleGetStarted} className="btn btn-secondary full-width">Join for Free</button>
                        </div>
                        <div className="pricing-card card popular">
                            <div className="popular-tag">Most Popular</div>
                            <h3>Premium Plan</h3>
                            <p className="price">₹4999 <span className="period">/ lifetime</span></p>
                            <ul className="pricing-features">
                                <li>✅ Unlimited Access to All Videos</li>
                                <li>✅ Downloadable Notes & Resources</li>
                                <li>✅ Certificate of Completion</li>
                                <li>✅ Priority Support</li>
                            </ul>
                            <Link to="/signup" className="btn btn-cta full-width">Get Premium</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} YaTi Learning Platform. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;
