
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaTrash, FaUserShield } from 'react-icons/fa';
import { db } from '../../firebase';
import '../../index.css';

const ManageTeachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

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
            setMessage('Error fetching teachers.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTeacher = async (teacherId) => {
        if (!window.confirm("Are you sure? This will remove the teacher's access immediately. Their courses will remain but be unassigned.")) return;

        setLoading(true);
        try {
            // 1. Delete user document
            await deleteDoc(doc(db, 'users', teacherId));

            // 2. Unassign courses (Optional but good for data integrity)
            // Query courses where teacherId == teacherId
            const q = query(collection(db, 'courses'), where('teacherId', '==', teacherId));
            const coursesSnap = await getDocs(q);

            if (!coursesSnap.empty) {
                const batch = writeBatch(db);
                coursesSnap.forEach(docSnap => {
                    batch.update(docSnap.ref, { teacherId: '' }); // or null
                });
                await batch.commit();
            }

            setMessage('Teacher removed successfully.');
            fetchTeachers();
        } catch (err) {
            console.error(err);
            setMessage('Error removing teacher.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-4">Loading Teachers...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1>Manage Teachers</h1>
            </div>

            {message && <div style={{ marginBottom: '1rem', padding: '1rem', background: message.includes('Error') ? '#fee2e2' : '#d1fae5', color: message.includes('Error') ? '#991b1b' : '#065f46', borderRadius: 'var(--radius)' }}>{message}</div>}

            {teachers.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <FaUserShield style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <h3>No Teachers Found</h3>
                    <p>Create a teacher account to get started.</p>
                </div>
            ) : (
                <div className="table-container card" style={{ padding: 0 }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                {teacher.name ? teacher.name[0].toUpperCase() : 'T'}
                                            </div>
                                            {teacher.name}
                                        </div>
                                    </td>
                                    <td>{teacher.email}</td>
                                    <td>{teacher.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : 'N/A'}</td>
                                    <td>
                                        <button
                                            onClick={() => handleDeleteTeacher(teacher.id)}
                                            className="btn btn-danger"
                                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', gap: '0.5rem' }}
                                        >
                                            <FaTrash /> Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ManageTeachers;
