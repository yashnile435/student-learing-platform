import { collection, deleteDoc, doc, getDocs, query, where, writeBatch, increment, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaTrash, FaEdit, FaExclamationTriangle, FaSearch, FaLayerGroup } from 'react-icons/fa';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

const EditLessons = () => {
    const { user, userRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState([]);
    const [filteredLessons, setFilteredLessons] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState(null); // { isOpen: false, lesson: null }
    const [editModal, setEditModal] = useState(null); // { isOpen: false, lesson: null }
    const [editTitle, setEditTitle] = useState('');
    const [editVideoId, setEditVideoId] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchLessons();
    }, [user, userRole]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredLessons(lessons);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredLessons(lessons.filter(l =>
                l.title.toLowerCase().includes(lower) ||
                l.courseName.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, lessons]);

    const fetchLessons = async () => {
        setLoading(true);
        try {
            let coursesQuery;
            if (userRole === 'teacher') {
                coursesQuery = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
            } else {
                // Admin sees all
                coursesQuery = query(collection(db, 'courses'));
            }

            const coursesSnap = await getDocs(coursesQuery);
            const courses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let allLessons = [];

            // Fetch lessons for each course
            await Promise.all(courses.map(async (course) => {
                const lessonsRef = collection(db, 'courses', course.id, 'lessons');
                const lessonsSnap = await getDocs(lessonsRef);

                const courseLessons = lessonsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    courseId: course.id,
                    courseName: course.title,
                    teacherId: course.teacherId // Inherit for validation
                }));
                allLessons = [...allLessons, ...courseLessons];
            }));

            // Sort by creation date if available
            allLessons.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });

            setLessons(allLessons);
            setFilteredLessons(allLessons);

        } catch (error) {
            console.error("Error fetching lessons:", error);
            setMessage('Error loading lessons.');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (lesson) => {
        setDeleteModal({ isOpen: true, lesson });
    };

    const handleDelete = async () => {
        if (!deleteModal?.lesson) return;

        setIsDeleting(true);
        const targetLesson = deleteModal.lesson;

        try {
            // 1. Validation (Double Check)
            if (userRole !== 'admin' && targetLesson.teacherId !== user.uid) {
                throw new Error("Unauthorized: You can only delete your own lessons.");
            }

            // 2. Delete Lesson Document
            await deleteDoc(doc(db, 'courses', targetLesson.courseId, 'lessons', targetLesson.id));

            // 3. Update Course Count
            const courseRef = doc(db, 'courses', targetLesson.courseId);
            await updateDoc(courseRef, {
                totalLessons: increment(-1)
            });

            // 4. UI Update
            setMessage('Lesson deleted successfully.');
            setLessons(prev => prev.filter(l => l.id !== targetLesson.id));
            setDeleteModal(null);

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(''), 3000);

        } catch (error) {
            console.error("Error deleting lesson:", error);
            setMessage('Error deleting lesson: ' + error.message);
        } finally {

            setIsDeleting(false);
        }
    };

    const openEditModal = (lesson) => {
        setEditTitle(lesson.title);
        setEditVideoId(lesson.videoId);
        setEditModal({ isOpen: true, lesson });
    };

    const handleUpdateLesson = async () => {
        if (!editModal?.lesson) return;

        setIsEditing(true);
        const targetLesson = editModal.lesson;

        try {
            // 1. Validation
            if (userRole !== 'admin' && targetLesson.teacherId !== user.uid) {
                throw new Error("Unauthorized: You can only edit your own lessons.");
            }

            if (!editTitle.trim() || !editVideoId.trim()) {
                throw new Error("Title and Video ID are required.");
            }

            // 2. Update Lesson Document
            const lessonRef = doc(db, 'courses', targetLesson.courseId, 'lessons', targetLesson.id);
            await updateDoc(lessonRef, {
                title: editTitle.trim(),
                videoId: editVideoId.trim(),
                // Optionally update duration if you had a field for it
            });

            // 3. UI Update
            setMessage('Lesson updated successfully.');
            setLessons(prev => prev.map(l =>
                l.id === targetLesson.id
                    ? { ...l, title: editTitle.trim(), videoId: editVideoId.trim() }
                    : l
            ));
            setEditModal(null);

            // Clear success message after 3 seconds
            setTimeout(() => setMessage(''), 3000);

        } catch (error) {
            console.error("Error updating lesson:", error);
            setMessage('Error updating lesson: ' + error.message);
        } finally {
            setIsEditing(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Edit Lessons</h1>
                <div style={{ position: 'relative' }}>
                    <FaSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="form-input"
                        placeholder="Search lessons..."
                        style={{ paddingLeft: '2.5rem', width: '250px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius)',
                    background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                    color: message.includes('Error') ? '#991b1b' : '#065f46'
                }}>
                    {message}
                </div>
            )}

            {loading ? (
                <p>Loading lessons...</p>
            ) : filteredLessons.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No lessons found.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Lesson Title</th>
                                    <th>Course</th>
                                    <th>Video ID</th>
                                    <th>Created At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLessons.map(lesson => (
                                    <tr key={lesson.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{lesson.title}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                                <FaLayerGroup style={{ color: 'var(--primary-color)' }} />
                                                {lesson.courseName}
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                {lesson.videoId}
                                            </code>
                                        </td>
                                        <td>
                                            {lesson.createdAt ? new Date(lesson.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => openEditModal(lesson)}
                                                    className="btn btn-icon"
                                                    style={{ background: '#e0e7ff', color: '#4f46e5' }}
                                                    title="Edit Lesson"
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(lesson)}
                                                    className="btn btn-icon"
                                                    style={{ background: '#fee2e2', color: '#ef4444' }}
                                                    title="Delete Lesson"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {deleteModal?.isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: 'var(--radius)',
                        maxWidth: '400px', width: '90%', boxShadow: 'var(--shadow-lg)',
                        textAlign: 'center', animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '1rem' }}>
                            <FaExclamationTriangle />
                        </div>
                        <h3 className="mb-2">Delete Lesson?</h3>
                        <p className="mb-4">
                            Are you sure you want to delete <strong>{deleteModal.lesson.title}</strong>?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteModal(null)}
                                className="btn btn-secondary"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn btn-danger"
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal?.isOpen && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        background: 'white', padding: '2rem', borderRadius: 'var(--radius)',
                        maxWidth: '500px', width: '90%', boxShadow: 'var(--shadow-lg)',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <h3 className="mb-4">Edit Lesson</h3>

                        <div className="form-group">
                            <label className="form-label">Lesson Title</label>
                            <input
                                className="form-input"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                disabled={isEditing}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Video ID (YouTube)</label>
                            <input
                                className="form-input"
                                value={editVideoId}
                                onChange={(e) => setEditVideoId(e.target.value)}
                                disabled={isEditing}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button
                                type="button"
                                onClick={() => setEditModal(null)}
                                className="btn btn-secondary"
                                disabled={isEditing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleUpdateLesson}
                                className="btn btn-primary"
                                disabled={isEditing}
                            >
                                {isEditing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default EditLessons;
