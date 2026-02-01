
import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import '../index.css'; // Ensure new styles

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const checkRoleAndRedirect = async (uid) => {
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
        <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '0 1rem' }}>
            <div className="card">
                <h2 className="text-center" style={{ marginBottom: '2rem' }}>Welcome Back</h2>
                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            required
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder="you@example.com"
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
                            placeholder="••••••••"
                        />
                    </div>
                    <button disabled={loading} type="submit" className="btn btn-primary w-full" style={{ marginBottom: '1rem' }}>
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>

                    <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>OR</div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="btn btn-secondary w-full"
                        style={{ display: 'flex', gap: '0.5rem' }}
                    >
                        <FaGoogle /> Continue with Google
                    </button>

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Sign Up</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
