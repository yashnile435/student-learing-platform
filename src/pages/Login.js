
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { FaGoogle, FaTimes } from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import { db } from '../firebase';
import '../styles/Auth.css';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const checkRoleAndRedirect = async (uid) => {
        if (location.state?.from) {
            navigate(location.state.from, { state: location.state, replace: true });
            return;
        }

        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && (userDoc.data().role === 'admin' || userDoc.data().role === 'teacher')) {
            navigate('/admin', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const result = await login(identifier, password);
            await checkRoleAndRedirect(result.user.uid);
        } catch (err) {
            console.error(err);
            let msg = 'Failed to log in.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = 'Invalid email or password.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Too many failed attempts. Try again later.';
            } else if (err.code === 'auth/invalid-email') {
                msg = 'Invalid email address.';
            }
            setError(msg);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');
            setLoading(true);
            const result = await loginWithGoogle();
            await checkRoleAndRedirect(result.user.uid);
        } catch (err) {
            setError('Google Log In failed. Please try again.');
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
                    <Link to="/signup" className="auth-tab">
                        Sign up
                    </Link>
                    <div className="auth-tab auth-tab-active">
                        Sign in
                    </div>
                </div>

                <h2 className="auth-modal-title">Welcome back</h2>

                {error && (
                    <div className="auth-modal-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-modal-form">
                    <input
                        type="text"
                        className="auth-modal-input"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Enter your email"
                    />

                    <PasswordInput
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                    />

                    <button
                        disabled={loading}
                        type="submit"
                        className="auth-modal-submit"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>

                    <div className="auth-modal-divider">
                        <span>OR SIGN IN WITH</span>
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
                        By signing in, you agree to our Terms & Service
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
