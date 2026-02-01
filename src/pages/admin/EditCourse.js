
import { collection, doc, getDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { FaArrowLeft, FaEdit, FaImage, FaVideo } from 'react-icons/fa';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import '../../index.css';

import { useLocation } from 'react-router-dom';

const EditCourse = () => {
    const { user, userRole } = useAuth();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [coursesList, setCoursesList] = useState([]);

    // Edit Specific State
    const [editCourseId, setEditCourseId] = useState('');



    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [coursePrice, setCoursePrice] = useState('');
    const [courseIsFree, setCourseIsFree] = useState(false);
    const [courseThumbnail, setCourseThumbnail] = useState('');
    const [courseVideoId, setCourseVideoId] = useState('');
    const [courseTeacherId, setCourseTeacherId] = useState('');

    const extractVideoId = (input) => {
        if (!input) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = input.match(regExp);
        return (match && match[2].length === 11) ? match[2] : input;
    };

    const handleVideoIdChange = (e) => {
        const val = e.target.value;
        const extracted = extractVideoId(val);
        setCourseVideoId(extracted);
    };

    const fetchCourses = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let q;
            if (userRole === 'teacher') {
                // Teacher: Only see assigned courses
                q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
            } else {
                // Admin: See all
                q = collection(db, 'courses');
            }

            const querySnapshot = await getDocs(q);
            const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoursesList(list);
        } catch (error) {
            console.error("Error fetching courses", error);
            setMessage("Error fetching courses.");
        } finally {
            setLoading(false);
        }
    }, [user, userRole]);

    useEffect(() => {
        fetchCourses();
    }, [user, userRole, fetchCourses]);

    const resetForm = useCallback(() => {
        setCourseTitle('');
        setCourseDesc('');
        setCoursePrice('');
        setCourseThumbnail('');
        setCourseVideoId('');
        setCourseIsFree(false);
        setCourseTeacherId('');
        setEditCourseId('');
    }, []);

    const handleCourseSelectForEdit = useCallback(async (id) => {
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
                setCourseVideoId(data.videoId || '');
                setCourseTeacherId(data.teacherId || '');
            }
        } catch (err) {
            console.error(err);
            setMessage('Error fetching course details.');
        } finally {
            setLoading(false);
        }
    }, [resetForm]);

    useEffect(() => {
        if (location.state?.courseId) {
            handleCourseSelectForEdit(location.state.courseId);
        }
    }, [location.state, handleCourseSelectForEdit]);

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        if (!editCourseId) return;

        setLoading(true);
        setMessage('');

        try {
            const docRef = doc(db, 'courses', editCourseId);

            const updateData = {
                title: courseTitle.trim(),
                description: courseDesc.trim(),
                price: courseIsFree ? 0 : (parseFloat(coursePrice) || 0),
                isFree: courseIsFree,
                thumbnail: courseThumbnail.trim(),
                videoId: courseVideoId.trim(),
            };

            // Only Admin can re-assign teachers
            if (userRole === 'admin') {
                updateData.teacherId = courseTeacherId.trim();
            }

            await updateDoc(docRef, updateData);

            setMessage('Course updated successfully!');
            // Refresh list in background in case simple fields changed
            fetchCourses();
        } catch (error) {
            console.error("Error updating course:", error);
            setMessage('Error updating course. ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW 1: PREVIEW LIST (My Courses) ---
    if (!editCourseId) {
        return (
            <div>
                <h1 className="mb-4">{userRole === 'teacher' ? 'My Assigned Courses' : 'All Courses (Edit)'}</h1>

                {loading && <p>Loading courses...</p>}

                {!loading && coursesList.length === 0 ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>No courses found. You need to be assigned to a course to see it here.</p>
                    </div>
                ) : (
                    <div className="courses-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {coursesList.map(course => (
                            <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                {/* Thumbnail */}
                                <div style={{
                                    height: '160px',
                                    background: '#cbd5e1',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {course.thumbnail ? (
                                        <img
                                            src={course.thumbnail}
                                            alt={course.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <FaImage style={{ fontSize: '3rem', color: '#94a3b8' }} />
                                    )}
                                    <div className={`badge ${course.isFree ? 'badge-free' : 'badge-paid'}`} style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                        {course.isFree ? 'FREE' : 'PAID'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', lineHeight: 1.4 }}>{course.title}</h3>
                                    <p style={{
                                        color: 'var(--text-muted)',
                                        fontSize: '0.9rem',
                                        marginBottom: '1rem',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {course.description || "No description provided."}
                                    </p>

                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {course.totalLessons || 0} Lessons
                                        </span>
                                        <button
                                            onClick={() => handleCourseSelectForEdit(course.id)}
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW 2: EDIT FORM ---
    return (
        <form onSubmit={handleUpdateCourse}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button type="button" onClick={() => resetForm()} className="btn" style={{ background: 'var(--bg-body)', color: 'var(--text-main)' }}>
                        <FaArrowLeft />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Edit Course</h1>
                </div>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius)',
                    marginBottom: '1.5rem',
                    background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
                    color: message.includes('Error') ? '#991b1b' : '#065f46'
                }}>
                    {message}
                </div>
            )}

            <div className="card">
                <div className="form-group">
                    <label className="form-label">Course Title</label>
                    <input className="form-input" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required />
                </div>

                {userRole === 'admin' && (
                    <div className="form-group">
                        <label className="form-label">Assigned Teacher UID</label>
                        <input
                            className="form-input"
                            value={courseTeacherId}
                            onChange={e => setCourseTeacherId(e.target.value)}
                            placeholder="Paste Teacher User ID here"
                        />
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows="4" value={courseDesc} onChange={e => setCourseDesc(e.target.value)} required />
                </div>

                <div className="form-group">
                    <label className="form-label">Thumbnail URL</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input className="form-input" value={courseThumbnail} onChange={e => setCourseThumbnail(e.target.value)} style={{ flex: 1 }} />
                        {courseThumbnail && (
                            <img src={courseThumbnail} alt="Preview" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Intro Video ID (Youtube)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FaVideo style={{ color: 'var(--text-muted)' }} />
                        <input className="form-input" value={courseVideoId} onChange={handleVideoIdChange} placeholder="e.g. dQw4w9WgXcQ" />
                    </div>
                </div>

                <div className="flex" style={{ gap: '2rem' }}>
                    {!courseIsFree && (
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Price (₹)</label>
                            <input type="number" className="form-input" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} />
                        </div>
                    )}

                    <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', marginTop: '1.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 500 }}>
                            <input type="checkbox" checked={courseIsFree} onChange={e => setCourseIsFree(e.target.checked)} style={{ width: '1.25rem', height: '1.25rem' }} />
                            Is Free Course?
                        </label>
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => resetForm()} className="btn" style={{ background: 'var(--bg-body)', color: 'var(--text-main)' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </form>
    );
};

export default EditCourse;
