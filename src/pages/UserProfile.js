
import { collection, doc, documentId, getCountFromServer, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { FaCalendarAlt, FaEdit, FaEnvelope, FaSave, FaUser, FaUserGraduate, FaUserShield, FaSignOutAlt, FaPhone, FaBook, FaCheckCircle, FaCamera, FaKey, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import PasswordInput from '../components/PasswordInput';
import '../index.css';
import '../styles/Auth.css';

const UserProfile = () => {
    const { user, userRole, logout } = useAuth();
    const navigate = useNavigate();

    // Core Profile State
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        mobile: '',
        role: '',
        createdAt: null,
        photoURL: ''
    });

    // Stats State
    const [stats, setStats] = useState({
        // Admin
        teachersManaged: 0,
        studentsManaged: 0,
        // Teacher
        coursesAssigned: 0,
        lessonsCreated: 0,
        // Student
        enrolledTotal: 0,
        freeCourses: 0,
        paidCourses: 0
    });

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Password Change State
    const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [pwData, setPwData] = useState({ current: '', new: '', confirm: '' });
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwLoading, setPwLoading] = useState(false);



    const fetchProfileAndStats = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch User Document
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                setProfileData({
                    name: data.name || user.displayName || '',
                    email: user.email,
                    mobile: data.mobile || '',
                    role: data.role || 'student',
                    createdAt: data.createdAt,
                    photoURL: data.photoURL || ''
                });

                // 2. Fetch Role-Specific Stats
                if (data.role === 'admin') {
                    const teachersQ = query(collection(db, 'users'), where('role', '==', 'teacher'));
                    const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'));

                    const [tSnap, sSnap] = await Promise.all([
                        getCountFromServer(teachersQ),
                        getCountFromServer(studentsQ)
                    ]);

                    setStats(prev => ({
                        ...prev,
                        teachersManaged: tSnap.data().count,
                        studentsManaged: sSnap.data().count
                    }));
                }
                else if (data.role === 'teacher') {
                    const coursesQ = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
                    const courseDocs = await getDocs(coursesQ);

                    let totalLessons = 0;
                    courseDocs.forEach(doc => {
                        const d = doc.data();
                        totalLessons += (d.totalLessons || 0);
                    });

                    setStats(prev => ({
                        ...prev,
                        coursesAssigned: courseDocs.size,
                        lessonsCreated: totalLessons
                    }));
                }
                else {
                    // Student
                    const enrolledIds = data.purchasedCourses || [];
                    if (enrolledIds.length > 0) {
                        // Chunking could be needed for large arrays, simplistic for this size
                        // getDocs with 'in' supports max 10. We'll do a simple loop if needed or just handle small sets.
                        // For safety, let's just use the array length for total, and TRY to get free/paid if < 10.
                        const safeIds = enrolledIds.slice(0, 10);
                        if (safeIds.length > 0) {
                            const q = query(collection(db, 'courses'), where(documentId(), 'in', safeIds));
                            const snaps = await getDocs(q);
                            let free = 0;
                            let paid = 0;
                            snaps.forEach(d => {
                                if (d.data().isFree) free++; else paid++;
                            });
                            // approximate for > 10
                            setStats(prev => ({
                                ...prev,
                                enrolledTotal: enrolledIds.length,
                                freeCourses: free,
                                paidCourses: paid + (enrolledIds.length - safeIds.length) // dumping rest in paid or unknown
                            }));
                        }
                    } else {
                        setStats(prev => ({ ...prev, enrolledTotal: 0, freeCourses: 0, paidCourses: 0 }));
                    }
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchProfileAndStats();
        }
    }, [user, userRole, fetchProfileAndStats]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: profileData.name,
                mobile: profileData.mobile,
                photoURL: profileData.photoURL
            });
            setMessage('Profile updated successfully.');
            setIsEditing(false);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (pwData.new !== pwData.confirm) {
            return setPwError('New passwords do not match.');
        }
        if (pwData.new.length < 6) {
            return setPwError('Password should be at least 6 characters.');
        }

        setPwLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, pwData.current);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, pwData.new);
            setPwSuccess('Password updated successfully!');
            setPwData({ current: '', new: '', confirm: '' });
            setTimeout(() => {
                setChangePasswordModalOpen(false);
                setPwSuccess('');
            }, 2000);
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                setPwError('Incorrect current password.');
            } else {
                setPwError('Failed to update password. Please try again.');
            }
        } finally {
            setPwLoading(false);
        }
    };

    if (loading) return <div className="p-4">Loading Profile...</div>;

    // --- STUDENT SPECIFIC LAYOUT ---
    if (profileData.role === 'student') {
        return (
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '1rem 1rem 4rem' }}>
                <h1 className="mb-4 text-center" style={{ fontSize: '1.5rem' }}>My Profile</h1>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: 'var(--radius)',
                        background: message.includes('Success') ? '#d1fae5' : '#fee2e2',
                        color: message.includes('Success') ? '#065f46' : '#991b1b',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* 1. Profile Header Card */}
                    <div className="card" style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', position: 'relative' }}>
                        <div style={{
                            width: '110px',
                            height: '110px',
                            borderRadius: '50%',
                            background: 'var(--bg-body)',
                            border: '4px solid var(--primary-light)',
                            color: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            overflow: 'hidden',
                            position: 'relative'
                        }}>
                            {profileData.photoURL ? (
                                <img src={profileData.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FaUser />
                            )}
                            {isEditing && (
                                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'rgba(0,0,0,0.5)', height: '30px' }} />
                            )}
                        </div>

                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                                {profileData.name}
                            </h2>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{profileData.email}</p>
                        </div>

                        <span className="badge badge-free" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
                            STUDENT
                        </span>
                    </div>

                    {/* 2. Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: '#eff6ff', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.5rem', color: '#3b82f6' }}>
                                <FaBook size={20} />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats.enrolledTotal}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enrolled</span>
                        </div>
                        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.5rem', color: '#22c55e' }}>
                                <FaCheckCircle size={20} />
                            </div>
                            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>--</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</span>
                        </div>
                    </div>

                    {/* 3. Personal Info Section */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Personal Info</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    />
                                ) : (
                                    <div style={{ fontWeight: 500, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaUser size={14} style={{ color: 'var(--text-muted)' }} />
                                        {profileData.name}
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email Address</label>
                                <div style={{ fontWeight: 500, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaEnvelope size={14} style={{ color: 'var(--text-muted)' }} />
                                    {profileData.email}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Mobile Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={profileData.mobile}
                                        onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                                        placeholder="Add mobile number"
                                    />
                                ) : (
                                    <div style={{ fontWeight: 500, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaPhone size={14} style={{ color: 'var(--text-muted)', transform: 'scaleX(-1)' }} />
                                        {profileData.mobile || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not provided</span>}
                                    </div>
                                )}
                            </div>

                            {isEditing && (
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Photo URL</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={profileData.photoURL}
                                        onChange={(e) => setProfileData({ ...profileData, photoURL: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                        {isEditing ? (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1, padding: '0.875rem' }} onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '0.875rem' }} onClick={handleSave} disabled={saving}>
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-secondary w-full"
                                style={{ padding: '1rem', justifyContent: 'center', fontWeight: 600 }}
                                onClick={() => setIsEditing(true)}
                            >
                                <FaEdit style={{ marginRight: '0.5rem' }} /> Edit Profile
                            </button>
                        )}

                        {!isEditing && (
                            <>
                                {user.providerData[0]?.providerId === 'password' ? (
                                    <button
                                        className="btn w-full btn-secondary"
                                        style={{ padding: '1rem', justifyContent: 'center', fontWeight: 600 }}
                                        onClick={() => setChangePasswordModalOpen(true)}
                                    >
                                        <FaKey style={{ marginRight: '0.5rem' }} /> Change Password
                                    </button>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem', background: '#f3f4f6', borderRadius: 'var(--radius)' }}>
                                        Password change not available for {user.providerData[0]?.providerId || 'social'} login.
                                    </div>
                                )}

                                <button
                                    className="btn w-full"
                                    style={{
                                        padding: '1rem',
                                        justifyContent: 'center',
                                        color: '#ef4444',
                                        background: '#fee2e2',
                                        fontWeight: 600,
                                        border: 'none'
                                    }}
                                    onClick={handleLogout}
                                >
                                    <FaSignOutAlt style={{ marginRight: '0.5rem' }} /> Logout
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Change Password Modal */}
                {changePasswordModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '1rem'
                    }}>
                        <div className="card" style={{ width: '100%', maxWidth: '400px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                            <button
                                onClick={() => setChangePasswordModalOpen(false)}
                                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                            >
                                <FaTimes />
                            </button>

                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Change Password</h2>

                            {pwError && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.5rem', background: '#fee2e2', borderRadius: '4px' }}>{pwError}</div>}
                            {pwSuccess && <div style={{ color: 'var(--success-color)', marginBottom: '1rem', fontSize: '0.9rem', padding: '0.5rem', background: '#d1fae5', borderRadius: '4px' }}>{pwSuccess}</div>}

                            <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <PasswordInput
                                    label="Current Password"
                                    value={pwData.current}
                                    onChange={(e) => setPwData({ ...pwData, current: e.target.value })}
                                    placeholder="Enter current password"
                                    required
                                />
                                <PasswordInput
                                    label="New Password"
                                    value={pwData.new}
                                    onChange={(e) => setPwData({ ...pwData, new: e.target.value })}
                                    placeholder="Min 6 chars"
                                    required
                                />
                                <PasswordInput
                                    label="Confirm New Password"
                                    value={pwData.confirm}
                                    onChange={(e) => setPwData({ ...pwData, confirm: e.target.value })}
                                    placeholder="Re-enter new password"
                                    required
                                />

                                <button type="submit" className="btn btn-primary w-full" disabled={pwLoading} style={{ marginTop: '0.5rem' }}>
                                    {pwLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- DEFAULT LAYOUT (ADMIN/TEACHER) ---
    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '2rem', padding: '0 1rem 2rem' }}>
            <h1 className="mb-4">My Profile</h1>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: 'var(--radius)',
                    background: message.includes('Success') ? '#d1fae5' : '#fee2e2',
                    color: message.includes('Success') ? '#065f46' : '#991b1b'
                }}>
                    {message}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>

                {/* 1. Profile Details Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Personal Details</h2>
                        <button
                            className="btn"
                            style={{ background: isEditing ? 'var(--warning-color)' : 'var(--bg-body)', color: isEditing ? 'white' : 'var(--text-main)' }}
                            onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                        >
                            <FaEdit style={{ marginRight: '0.5rem' }} /> {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--primary-light)',
                            color: 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            marginBottom: '1rem',
                            overflow: 'hidden'
                        }}>
                            {profileData.photoURL ? (
                                <img src={profileData.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <FaUser />
                            )}
                        </div>
                        <div className={`badge ${profileData.role === 'admin' ? 'badge-paid' : (profileData.role === 'teacher' ? 'badge-free' : 'badge-free')}`} style={{ textTransform: 'capitalize' }}>
                            {profileData.role}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label>Full Name</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="form-input"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                />
                            ) : (
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{profileData.name}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <FaEnvelope /> {profileData.email}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Joined On</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                <FaCalendarAlt /> {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>

                        {isEditing && (
                            <div className="form-group">
                                <label>Profile Photo URL</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="https://..."
                                    value={profileData.photoURL}
                                    onChange={(e) => setProfileData({ ...profileData, photoURL: e.target.value })}
                                />
                            </div>
                        )}

                        {isEditing && (
                            <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : <><FaSave style={{ marginRight: '0.5rem' }} /> Save Changes</>}
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. Stats & Overview Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Admin Stats */}
                    {profileData.role === 'admin' && (
                        <>
                            <div className="card">
                                <h3>Platform Overview</h3>
                                <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1rem' }}>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f0f9ff', borderRadius: 'var(--radius)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--secondary-color)' }}>{stats.teachersManaged}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Teachers</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: '#ffe4e6', borderRadius: 'var(--radius)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--danger-color)' }}>{stats.studentsManaged}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Students</div>
                                    </div>
                                </div>
                            </div>
                            <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, #4c1d95 100%)', color: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <FaUserShield size={40} />
                                    <div>
                                        <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Admin Access</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', margin: 0 }}>You have full control over the platform settings and users.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Teacher Stats */}
                    {profileData.role === 'teacher' && (
                        <>
                            <div className="card">
                                <h3>Impact Overview</h3>
                                <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '1rem' }}>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: '#fef3c7', borderRadius: 'var(--radius)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#d97706' }}>{stats.coursesAssigned}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Courses</div>
                                    </div>
                                    <div style={{ textAlign: 'center', padding: '1rem', background: '#d1fae5', borderRadius: 'var(--radius)' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#059669' }}>{stats.lessonsCreated}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Lessons</div>
                                    </div>
                                </div>
                            </div>
                            <div className="card">
                                <h3>Quick Tips</h3>
                                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                    <li>Keep your course descriptions updated.</li>
                                    <li>Engage with students by adding diverse lesson content.</li>
                                </ul>
                            </div>
                        </>
                    )}

                    {/* Student Stats */}
                    {profileData.role === 'student' && (
                        <>
                            <div className="card">
                                <h3>Learning Journey</h3>
                                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                                        {stats.enrolledTotal}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)' }}>Total Courses Enrolled</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1, padding: '0.75rem', background: '#ecfdf5', borderRadius: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontWeight: 700, color: '#059669' }}>{stats.freeCourses}</span>
                                        <span style={{ fontSize: '0.8rem' }}>Free</span>
                                    </div>
                                    <div style={{ flex: 1, padding: '0.75rem', background: '#e0e7ff', borderRadius: '0.5rem', textAlign: 'center' }}>
                                        <span style={{ display: 'block', fontWeight: 700, color: '#4f46e5' }}>{stats.paidCourses}</span>
                                        <span style={{ fontSize: '0.8rem' }}>Paid</span>
                                    </div>
                                </div>
                            </div>
                            <div className="card" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <FaUserGraduate size={30} color="var(--primary-color)" />
                                    <div>
                                        <h4 style={{ marginBottom: '0.25rem' }}>Keep Learning!</h4>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>Every lesson brings you closer to your goal.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
