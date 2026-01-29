
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import '../styles/Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const checkRoleAndRedirect = async (uid) => {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        // Robust check: Redirect based on role in DB
        if (userDoc.exists() && userDoc.data().role === 'admin') {
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
            const result = await login(email, password);
            await checkRoleAndRedirect(result.user.uid);
        } catch (err) {
            console.error(err);
            let msg = 'Failed to log in.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = 'Invalid email or password.';
            } else if (err.code === 'auth/too-many-requests') {
                msg = 'Too many failed attempts. Try again later.';
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
        <div className="auth-container">
            <div className="card auth-card">
                <h2 className="auth-title">Welcome Back</h2>
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button disabled={loading} type="submit" className="btn btn-primary full-width">
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>OR</span>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="btn btn-google full-width"
                >
                    <FaGoogle /> Continue with Google
                </button>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup" className="auth-link">Sign Up</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
