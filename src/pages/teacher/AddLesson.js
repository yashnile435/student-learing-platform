
import { addDoc, collection, doc, getDocs, increment, updateDoc, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { getYoutubeId } from '../../utils/youtubeUtils';
import { useAuth } from '../../context/AuthContext';

const AddLesson = () => {
    const { user, userData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [coursesList, setCoursesList] = useState([]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonVideoId, setLessonVideoId] = useState('');
    const [lessonDuration, setLessonDuration] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            if (!user || !userData) return;

            try {
                let q;
                if (userData.role === 'admin') {
                    // Admins see all courses
                    q = query(collection(db, 'courses'));
                } else if (userData.role === 'teacher') {
                    // Teachers only see their own courses
                    q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
                } else {
                    // Students or others shouldn't be here
                    return;
                }

                const querySnapshot = await getDocs(q);
                const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCoursesList(list);
            } catch (error) {
                console.error("Error fetching courses", error);
                setMessage("Error loading courses. Please refresh.");
            }
        };

        fetchCourses();
    }, [user, userData]);

    const handleAddLesson = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // 1. Validation
        if (!selectedCourseId) {
            setMessage('Error: Please select a course.');
            setLoading(false);
            return;
        }

        if (!lessonTitle.trim()) {
            setMessage('Error: Lesson title is required.');
            setLoading(false);
            return;
        }

        const cleanVideoId = getYoutubeId(lessonVideoId);
        if (!cleanVideoId) {
            setMessage('Error: Invalid YouTube URL or ID.');
            setLoading(false);
            return;
        }

        // 2. Permission Check (Double check)
        const selectedCourse = coursesList.find(c => c.id === selectedCourseId);
        if (!selectedCourse) {
            setMessage('Error: Invalid course selected.');
            setLoading(false);
            return;
        }

        if (userData.role !== 'admin' && selectedCourse.teacherId !== user.uid) {
            setMessage('Error: You do not have permission to add lessons to this course.');
            setLoading(false);
            return;
        }

        try {
            // 3. Firestore Write (lessons subcollection)
            // Path: courses/{courseId}/lessons
            await addDoc(collection(db, 'courses', selectedCourseId, 'lessons'), {
                title: lessonTitle.trim(),
                videoId: cleanVideoId,
                duration: parseInt(lessonDuration) || 0,
                createdAt: new Date().toISOString()
            });

            // 4. Update Course Count
            const courseRef = doc(db, 'courses', selectedCourseId);
            await updateDoc(courseRef, {
                totalLessons: increment(1)
            });

            // 5. Success Feedback
            setMessage('Lesson added successfully!');
            setLessonTitle('');
            setLessonVideoId('');
            setLessonDuration('');
            // Keep selected course for convenience or reset? user might add multiple lessons to same course.
            // Keeping it is better UX.
        } catch (error) {
            console.error("Error adding lesson:", error);
            const errStr = error.toString();

            if (error.code === 'permission-denied') {
                setMessage('Error: Permission denied. You are not authorized to edit this course.');
            } else if (errStr.includes('offline') || errStr.includes('network') || errStr.includes('fetch') || error.code === 'unavailable') {
                setMessage('Network Error: Database connection failed. Please disable AdBlocker or check connection.');
            } else {
                setMessage('Error adding lesson: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleAddLesson} style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="mb-4">Add Lesson</h1>
            {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

            <div className="form-group">
                <label className="form-label">Select Course</label>
                <select
                    className="form-input"
                    value={selectedCourseId}
                    onChange={e => setSelectedCourseId(e.target.value)}
                    required
                    disabled={loading}
                >
                    <option value="">-- Select a Course --</option>
                    {coursesList.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
                {coursesList.length === 0 && userData && (
                    <small className="text-muted">No courses found for your account.</small>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Lesson Title</label>
                <input
                    className="form-input"
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    required
                    placeholder="e.g. Introduction to React"
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label className="form-label">YouTube Video ID (or URL)</label>
                <input
                    className="form-input"
                    value={lessonVideoId}
                    onChange={e => setLessonVideoId(e.target.value)}
                    required
                    placeholder="e.g. dQw4w9WgXcQ or https://youtu.be/..."
                    disabled={loading}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Duration (mins)</label>
                <input
                    type="number"
                    className="form-input"
                    value={lessonDuration}
                    onChange={e => setLessonDuration(e.target.value)}
                    required
                    placeholder="e.g. 15"
                    disabled={loading}
                />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Adding Lesson...' : 'Add Lesson'}
            </button>
        </form>
    );
};

export default AddLesson;
