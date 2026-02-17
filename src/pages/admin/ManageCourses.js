import { useNavigate } from 'react-router-dom';
import { FaBook, FaTag, FaLayerGroup, FaEdit, FaTrash } from 'react-icons/fa';
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import '../../index.css';

const ManageCourses = () => {
    const navigate = useNavigate();
    const [coursesList, setCoursesList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'courses'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoursesList(list);
        } catch (error) {
            console.error("Error fetching courses", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm("Are you sure? This will delete the course and ALL its lessons permanently.")) return;

        setLoading(true);
        try {
            const lessonsRef = collection(db, 'courses', id, 'lessons');
            const lessonsSnap = await getDocs(lessonsRef);

            const batch = writeBatch(db);
            lessonsSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            await deleteDoc(doc(db, 'courses', id));

            setMessage('Course deleted successfully.');
            fetchCourses();
        } catch (err) {
            console.error(err);
            setMessage('Error deleting course.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="mb-4">Manage Courses</h1>
            {message && <div style={{ marginBottom: '1rem', padding: '1rem', background: message.includes('Error') ? '#fee2e2' : '#d1fae5', color: message.includes('Error') ? '#991b1b' : '#065f46', borderRadius: 'var(--radius)' }}>{message}</div>}

            {loading && <p>Loading...</p>}

            {!loading && coursesList.length === 0 ? <p>No courses found.</p> : (
                <>
                    {/* Desktop Table View */}
                    <div className="table-container card hide-mobile" style={{ padding: 0 }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Lessons</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coursesList.map(course => (
                                    <tr key={course.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{course.title}</div>
                                        </td>
                                        <td>
                                            <span className={`badge ${course.isFree ? 'badge-free' : 'badge-paid'}`}>
                                                {course.isFree ? 'FREE' : 'PAID'}
                                            </span>
                                        </td>
                                        <td>{course.totalLessons || 0}</td>
                                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => navigate('/admin/edit', { state: { courseId: course.id } })}
                                                className="btn btn-primary"
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <FaEdit /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCourse(course.id)}
                                                className="btn btn-danger"
                                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <FaTrash /> Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="show-mobile">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {coursesList.map(course => (
                                <div key={course.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{course.title}</div>
                                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                            <span className={`badge ${course.isFree ? 'badge-free' : 'badge-paid'}`}>
                                                {course.isFree ? 'FREE' : 'PAID'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                                                <FaLayerGroup /> {course.totalLessons || 0} Lessons
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                        <button
                                            onClick={() => navigate('/admin/edit', { state: { courseId: course.id } })}
                                            className="btn btn-primary"
                                            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCourse(course.id)}
                                            className="btn btn-danger"
                                            style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManageCourses;
