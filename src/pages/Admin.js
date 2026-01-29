import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, updateDoc, writeBatch, query, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../firebase';
import { getYoutubeId } from '../utils/youtubeUtils';
import AdminNavbar from '../components/AdminNavbar';
import '../styles/Admin.css';

const Admin = () => {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'manage-courses';
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Course Form State (Shared for Create & Edit)
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [coursePrice, setCoursePrice] = useState('');
    const [courseIsFree, setCourseIsFree] = useState(false);
    const [courseThumbnail, setCourseThumbnail] = useState('');
    
    // Edit Specific State
    const [editCourseId, setEditCourseId] = useState('');

    // Add Lesson State
    const [coursesList, setCoursesList] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonVideoId, setLessonVideoId] = useState('');
    const [lessonDuration, setLessonDuration] = useState('');

    // Trigger data fetch or cleanup when tab changes
    useEffect(() => {
        resetForm(); // Clean up forms on navigation
        fetchCourses();
    }, [activeTab]);

    const fetchCourses = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'courses'));
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoursesList(list);
        } catch (error) {
            console.error("Error fetching courses", error);
        }
    };

    const resetForm = () => {
        setCourseTitle('');
        setCourseDesc('');
        setCoursePrice('');
        setCourseThumbnail('');
        setCourseIsFree(false);
        setEditCourseId('');
        setSelectedCourseId('');
        setMessage('');
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await addDoc(collection(db, 'courses'), {
                title: courseTitle.trim(),
                description: courseDesc.trim(),
                price: courseIsFree ? 0 : (parseFloat(coursePrice) || 0),
                isFree: courseIsFree,
                thumbnail: courseThumbnail.trim(),
                totalLessons: 0,
                createdAt: new Date().toISOString()
            });

            setMessage('Course created successfully!');
            resetForm();
        } catch (error) {
            console.error("Error creating course:", error);
            setMessage('Error creating course.');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelectForEdit = async (e) => {
        const id = e.target.value;
        setEditCourseId(id);
        setMessage('');
        
        if (!id) {
            resetForm();
            return;
        }

        setLoading(true);
        try {
            const docRef = doc(db, 'courses', id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCourseTitle(data.title);
                setCourseDesc(data.description);
                setCoursePrice(data.price || '');
                setCourseIsFree(data.isFree);
                setCourseThumbnail(data.thumbnail);
            }
        } catch (err) {
            console.error(err);
            setMessage('Error fetching course details.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        if (!editCourseId) return;

        setLoading(true);
        setMessage('');

        try {
            const docRef = doc(db, 'courses', editCourseId);
            await updateDoc(docRef, {
                title: courseTitle.trim(),
                description: courseDesc.trim(),
                price: courseIsFree ? 0 : (parseFloat(coursePrice) || 0),
                isFree: courseIsFree,
                thumbnail: courseThumbnail.trim(),
                // NOT updating totalLessons or createdAt to preserve integrity
            });

            setMessage('Course updated successfully!');
            // Optional: Don't reset if they want to keep editing? 
            // Let's reset for clarity or keep it. I'll keep it populated but show success.
        } catch (error) {
            console.error("Error updating course:", error);
            setMessage('Error updating course.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        if (!selectedCourseId) {
            setMessage('Please select a course.');
            setLoading(false);
            return;
        }

        const cleanVideoId = getYoutubeId(lessonVideoId);
        if (!cleanVideoId) {
             setMessage('Error: Invalid YouTube URL or ID.');
             setLoading(false);
             return;
        }

        try {
            // 1. Add Lesson to Subcollection
            await addDoc(collection(db, 'courses', selectedCourseId, 'lessons'), {
                title: lessonTitle.trim(),
                videoId: cleanVideoId,
                duration: parseInt(lessonDuration) || 0,
                createdAt: new Date().toISOString()
            });

            // 2. Atomically Increment lesson count on Course Document
            const courseRef = doc(db, 'courses', selectedCourseId);
            await updateDoc(courseRef, {
                totalLessons: increment(1)
            });

            setMessage('Lesson added and course updated successfully!');
            setLessonTitle('');
            setLessonVideoId('');
            setLessonDuration('');
        } catch (error) {
            console.error("Error adding lesson:", error);
            setMessage('Error adding lesson.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm("Are you sure? This will delete the course and ALL its lessons permanently.")) return;
        
        setLoading(true);
        try {
            // 1. Delete Subcollection (Lessons)
            // Firestore doesn't support recursive delete on client easily, so we batch fetch and delete.
            const lessonsRef = collection(db, 'courses', id, 'lessons');
            const lessonsSnap = await getDocs(lessonsRef);
            
            const batch = writeBatch(db);
            lessonsSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // 2. Delete Course Document
            await deleteDoc(doc(db, 'courses', id));

            setMessage('Course deleted successfully.');
            fetchCourses(); // Refresh list
        } catch (err) {
            console.error(err);
            setMessage('Error deleting course.');
        } finally {
            setLoading(false);
        }
    };

    // Analytics Helpers
    const getMostWatched = (isFree) => {
        return coursesList
            .filter(c => c.isFree === isFree)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 5);
    };

    return (
        <div className="admin-container container">
            <h1 className="mb-4">Admin Dashboard</h1>

            <AdminNavbar />

            <div className="admin-grid">
                <section className="admin-card card" style={{ width: '100%' }}>
                    {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

                    {/* MANAGE COURSES TAB */}
                    {activeTab === 'manage-courses' && (
                        <div>
                            <h2>Manage Courses</h2>
                            {coursesList.length === 0 ? <p>No courses found.</p> : (
                                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                            <th style={{ padding: '10px' }}>Title</th>
                                            <th style={{ padding: '10px' }}>Type</th>
                                            <th style={{ padding: '10px' }}>Lessons</th>
                                            <th style={{ padding: '10px' }}>Popularity</th>
                                            <th style={{ padding: '10px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coursesList.map(course => (
                                            <tr key={course.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                                <td style={{ padding: '10px' }}>{course.title}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span className={`badge ${course.isFree ? 'free' : 'premium'}`}>
                                                        {course.isFree ? 'FREE' : 'PAID'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px' }}>{course.totalLessons || 0}</td>
                                                <td style={{ padding: '10px' }}>{course.popularity || 0} views</td>
                                                <td style={{ padding: '10px' }}>
                                                    <button 
                                                        onClick={() => handleDeleteCourse(course.id)}
                                                        style={{ background: '#ff5252', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div>
                            <h2>Analytics Reports</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                                    <h3>Most Watched (Free)</h3>
                                    <ol style={{ paddingLeft: '20px' }}>
                                        {getMostWatched(true).map(c => (
                                            <li key={c.id} style={{ marginBottom: '8px' }}>
                                                <strong>{c.title}</strong> - {c.popularity || 0} views
                                            </li>
                                        ))}
                                        {getMostWatched(true).length === 0 && <p>No data yet.</p>}
                                    </ol>
                                </div>
                                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                                    <h3>Most Watched (Paid)</h3>
                                    <ol style={{ paddingLeft: '20px' }}>
                                        {getMostWatched(false).map(c => (
                                            <li key={c.id} style={{ marginBottom: '8px' }}>
                                                <strong>{c.title}</strong> - {c.popularity || 0} views
                                            </li>
                                        ))}
                                        {getMostWatched(false).length === 0 && <p>No data yet.</p>}
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'create-course' && (
                        <form onSubmit={handleCreateCourse}>
                            <h2>Create New Course</h2>
                            <div className="form-group">
                                <label className="form-label">Course Title</label>
                                <input className="form-input" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Thumbnail URL</label>
                                <input className="form-input" value={courseThumbnail} onChange={e => setCourseThumbnail(e.target.value)} placeholder="https://..." />
                            </div>
                            
                            {!courseIsFree && (
                                <div className="form-group">
                                    <label className="form-label">Price ($)</label>
                                    <input type="number" className="form-input" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} />
                                </div>
                            )}

                            <div className="form-group checkbox-group">
                                <input type="checkbox" id="isFree" checked={courseIsFree} onChange={e => setCourseIsFree(e.target.checked)} />
                                <label htmlFor="isFree">Is Free Course?</label>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Course'}</button>
                        </form>
                    )}

                    {activeTab === 'edit-course' && (
                        <form onSubmit={handleUpdateCourse}>
                            <h2>Edit Existing Course</h2>
                            <div className="form-group">
                                <label className="form-label">Select Course to Edit</label>
                                <select className="form-input" value={editCourseId} onChange={handleCourseSelectForEdit} required>
                                    <option value="">-- Select a Course --</option>
                                    {coursesList.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            {editCourseId && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">Course Title</label>
                                        <input className="form-input" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-input" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Thumbnail URL</label>
                                        <input className="form-input" value={courseThumbnail} onChange={e => setCourseThumbnail(e.target.value)} />
                                    </div>
                                    
                                    {!courseIsFree && (
                                        <div className="form-group">
                                            <label className="form-label">Price ($)</label>
                                            <input type="number" className="form-input" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} />
                                        </div>
                                    )}

                                    <div className="form-group checkbox-group">
                                        <input type="checkbox" id="isFreeEdit" checked={courseIsFree} onChange={e => setCourseIsFree(e.target.checked)} />
                                        <label htmlFor="isFreeEdit">Is Free Course?</label>
                                    </div>

                                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Course'}</button>
                                </>
                            )}
                        </form>
                    )}

                    {activeTab === 'add-lesson' && (
                        <form onSubmit={handleAddLesson}>
                            <h2>Add Lesson</h2>
                            <div className="form-group">
                                <label className="form-label">Select Course</label>
                                <select className="form-input" value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} required>
                                    <option value="">-- Select a Course --</option>
                                    {coursesList.map(c => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Lesson Title</label>
                                <input className="form-input" value={lessonTitle} onChange={e => setLessonTitle(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">YouTube Video ID (or URL)</label>
                                <input className="form-input" value={lessonVideoId} onChange={e => setLessonVideoId(e.target.value)} required placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..." />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duration (mins)</label>
                                <input type="number" className="form-input" value={lessonDuration} onChange={e => setLessonDuration(e.target.value)} required />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Adding Lesson...' : 'Add Lesson'}</button>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
};


export default Admin;
