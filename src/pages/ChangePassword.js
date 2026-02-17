
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';
import PasswordInput from '../components/common/PasswordInput';

const ChangePassword = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return setError('New passwords do not match');
        }

        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Re-authenticate user first (security best practice)
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);
            setSuccess('Password updated successfully!');
            setTimeout(() => navigate('/dashboard'), 2000);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect current password');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError('Failed to update password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card card">
                <h2 className="auth-title">Change Password</h2>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message" style={{ color: 'green', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem' }}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <PasswordInput
                            label="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            placeholder="Enter current password"
                        />
                    </div>

                    <div className="form-group">
                        <PasswordInput
                            label="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            placeholder="Enter new password"
                        />
                    </div>

                    <div className="form-group">
                        <PasswordInput
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
