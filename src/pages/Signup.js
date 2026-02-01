
import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        const pwdMsg = validatePassword(password);
        if (pwdMsg) {
            return setError(pwdMsg);
        }

        try {
            setError('');
            setLoading(true);
            await signup(email, password, name, mobile);
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
        <div style={{ maxWidth: '450px', margin: '4rem auto', padding: '0 1rem' }}>
            <div className="card">
                <h2 className="text-center" style={{ marginBottom: '2rem' }}>Create Account</h2>
                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Mobile Number</label>
                        <input
                            type="tel"
                            className="form-input"
                            required
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            pattern="[0-9]{10}"
                            placeholder="10-digit mobile number"
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
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <button disabled={loading} type="submit" className="btn btn-primary w-full" style={{ marginBottom: '1rem' }}>
                        {loading ? 'Creating Account...' : 'Sign Up'}
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
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Log In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;
