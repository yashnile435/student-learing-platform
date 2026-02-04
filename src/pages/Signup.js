
import { useState } from 'react';
import { FaGoogle, FaTimes } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import '../styles/Auth.css';

const Signup = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const validatePassword = (pwd) => {
        if (pwd.length < 6) return 'Password must be at least 6 characters.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const pwdMsg = validatePassword(password);
        if (pwdMsg) {
            return setError(pwdMsg);
        }

        try {
            setError('');
            setLoading(true);
            const fullName = `${firstName} ${lastName}`.trim();
            await signup(email, password, fullName, mobile);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            console.error("Signup failed:", err);
            let msg = 'Failed to create an account.';
            if (err.code === 'auth/email-already-in-use') msg = 'Email is already in use.';
            else if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
            else if (err.code === 'auth/weak-password') msg = 'Password is too weak.';
            setError(msg);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            await loginWithGoogle();
            navigate('/dashboard');
        } catch (err) {
            setError('Google Sign Up failed. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-container">
                <Link to="/" className="auth-modal-close">
                    <FaTimes />
                </Link>

                <div className="auth-tabs">
                    <div className="auth-tab auth-tab-active">
                        Sign up
                    </div>
                    <Link to="/login" className="auth-tab">
                        Sign in
                    </Link>
                </div>

                <h2 className="auth-modal-title">Create an account</h2>

                {error && (
                    <div className="auth-modal-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-modal-form">
                    <div className="auth-modal-row">
                        <input
                            type="text"
                            className="auth-modal-input"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First name"
                        />
                        <input
                            type="text"
                            className="auth-modal-input"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last name"
                        />
                    </div>

                    <input
                        type="email"
                        className="auth-modal-input"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                    />

                    <input
                        type="tel"
                        className="auth-modal-input"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="Mobile number"
                        pattern="[0-9]{10}"
                    />

                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Create a password"
                    />

                    <button
                        disabled={loading}
                        type="submit"
                        className="auth-modal-submit"
                    >
                        {loading ? 'Creating account...' : 'Create an account'}
                    </button>

                    <div className="auth-modal-divider">
                        <span>OR SIGN UP WITH</span>
                    </div>

                    <div className="auth-modal-social">
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="auth-modal-social-btn"
                        >
                            <FaGoogle />
                        </button>
                    </div>

                    <p className="auth-modal-terms">
                        By creating an account, you agree to our Terms & Service
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;
