
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaTrash, FaUserShield, FaEnvelope, FaCalendar, FaEdit, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { db } from '../../firebase';
import '../../index.css';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Edit State
    const [editingTeacher, setEditingTeacher] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
            const querySnapshot = await getDocs(q);
            const teacherList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeachers(teacherList);
        } catch (error) {
            console.error("Error fetching teachers", error);
            setMessage({ type: 'error', text: 'Failed to load teachers.' });
        } finally {
            setLoading(false);
        }
    };

    // --- EDIT HANDLERS ---
    const handleEditClick = (teacher) => {
        setEditingTeacher(teacher);
        setEditForm({ name: teacher.name || '', email: teacher.email || '' });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const teacherRef = doc(db, 'users', editingTeacher.id);
            await updateDoc(teacherRef, {
                name: editForm.name,
                email: editForm.email
            });

            // Optimistic Update
            setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? { ...t, ...editForm } : t));

            setMessage({ type: 'success', text: 'Teacher updated successfully.' });
            setEditingTeacher(null);
        } catch (error) {
            console.error('Error updating teacher:', error);
            setMessage({ type: 'error', text: 'Failed to update teacher.' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- DELETE HANDLERS ---
    const handleDeleteClick = (id) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            const teacherId = deleteId;

            // 1. Delete user document
            await deleteDoc(doc(db, 'users', teacherId));

            // 2. Unassign courses (Optional but good for data integrity)
            const q = query(collection(db, 'courses'), where('teacherId', '==', teacherId));
            const coursesSnap = await getDocs(q);

            if (!coursesSnap.empty) {
                const batch = writeBatch(db);
                coursesSnap.forEach(docSnap => {
                    batch.update(docSnap.ref, { teacherId: '' });
                });
                await batch.commit();
            }

            setTeachers(prev => prev.filter(t => t.id !== teacherId));
            setMessage({ type: 'success', text: 'Teacher removed successfully.' });
            setDeleteId(null);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error removing teacher.' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Auto-hide message
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1>Manage Teachers</h1>
                    <p style={{ marginTop: '-1rem' }}>View and manage instructor accounts</p>
                </div>
            </div>

            {/* MESSAGE ALERT */}
            {message && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    background: message.type === 'error' ? '#fee2e2' : '#d1fae5',
                    color: message.type === 'error' ? '#991b1b' : '#065f46',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {message.type === 'error' ? <FaTimes /> : <FaCheck />} {message.text}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && teachers.length === 0 && (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <div style={{
                        width: '80px', height: '80px', background: '#f5f3ff', borderRadius: '50%', color: 'var(--primary-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', fontSize: '2.5rem'
                    }}>
                        <FaUserShield />
                    </div>
                    <h3>No Teachers Found</h3>
                    <p>Create a teacher account to get started.</p>
                </div>
            )}

            {/* GRID LAYOUT */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '1.5rem'
            }}>
                {loading ? (
                    // LOADING SKELETONS
                    [1, 2, 3].map(n => (
                        <div key={n} className="card skeleton-pulse" style={{ height: '200px' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ height: '20px', background: '#e2e8f0', marginBottom: '0.5rem', width: '60%' }}></div>
                                    <div style={{ height: '14px', background: '#e2e8f0', width: '40%' }}></div>
                                </div>
                            </div>
                            <div style={{ height: '14px', background: '#e2e8f0', marginBottom: '0.5rem', width: '80%' }}></div>
                            <div style={{ height: '14px', background: '#e2e8f0', marginBottom: '1.5rem', width: '50%' }}></div>
                            <div style={{ height: '36px', background: '#e2e8f0', borderRadius: '8px' }}></div>
                        </div>
                    ))
                ) : (
                    // TEACHER CARDS
                    teachers.map(teacher => (
                        <div key={teacher.id} className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{
                                        width: '56px', height: '56px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, var(--primary-light) 0%, #c4b5fd 100%)',
                                        color: 'var(--primary-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', fontSize: '1.5rem', flexShrink: 0
                                    }}>
                                        {teacher.name ? teacher.name[0].toUpperCase() : 'T'}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{teacher.name}</h3>
                                        <div className="badge badge-free" style={{ marginTop: '0.25rem' }}>Teacher</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <FaEnvelope style={{ color: 'var(--primary-color)' }} />
                                    <span style={{ wordBreak: 'break-all' }}>{teacher.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                    <FaCalendar style={{ color: 'var(--primary-color)' }} />
                                    <span>Joined {teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => handleEditClick(teacher)}
                                    style={{ flex: 1, justifyContent: 'center' }}
                                >
                                    <FaEdit style={{ marginRight: '0.5rem' }} /> Edit
                                </button>
                                <button
                                    className="btn btn-secondary w-full"
                                    onClick={() => handleDeleteClick(teacher.id)}
                                    style={{ flex: 1, justifyContent: 'center', color: 'var(--danger-color)', borderColor: '#fee2e2', background: '#fff' }}
                                >
                                    <FaTrash style={{ marginRight: '0.5rem' }} /> Remove
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* EDIT MODAL */}
            {editingTeacher && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', animation: 'slideIn 0.2s ease-out' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Edit Teacher</h2>
                            <button onClick={() => setEditingTeacher(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit}>
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <input
                                    className="form-input"
                                    value={editForm.name}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Updating this does not change their login email.</small>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-secondary w-full" onClick={() => setEditingTeacher(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary w-full" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteId && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: '#fee2e2', color: 'var(--danger-color)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', fontSize: '1.5rem'
                        }}>
                            <FaExclamationTriangle />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Are you sure?</h2>
                        <p style={{ marginBottom: '2rem' }}>
                            This will remove the teacher's access immediately. Their courses will remain but be unassigned.
                            <br /><strong>This action cannot be undone.</strong>
                        </p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary w-full" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger w-full" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? 'Removing...' : 'Yes, Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTeachers;
