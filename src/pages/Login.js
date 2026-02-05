
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
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
                            aria-label="Continue with Google"
                        >
                            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.225 -9.429 56.472 -10.689 57.325 L -10.689 60.325 L -6.829 60.325 C -4.569 58.235 -3.264 55.159 -3.264 51.509 Z" />
                                    <path fill="#34A853" d="M -14.754 63.239 C -11.519 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.139 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.519 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                </g>
                            </svg>
                            <span>Continue with Google</span>
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
