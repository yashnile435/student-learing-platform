
import { addDoc, collection, doc, getDocs, increment, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { getYoutubeId } from '../../utils/youtubeUtils';
import '../../styles/Admin.css';

const AddLesson = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [coursesList, setCoursesList] = useState([]);

    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonVideoId, setLessonVideoId] = useState('');
    const [lessonDuration, setLessonDuration] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'courses'));
                const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCoursesList(list);
            } catch (error) {
                console.error("Error fetching courses", error);
            }
        };
        fetchCourses();
    }, []);

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
            await addDoc(collection(db, 'courses', selectedCourseId, 'lessons'), {
                title: lessonTitle.trim(),
                videoId: cleanVideoId,
                duration: parseInt(lessonDuration) || 0,
                createdAt: new Date().toISOString()
            });

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

    return (
        <form onSubmit={handleAddLesson}>
            <h1 className="mb-4">Add Lesson</h1>
            {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

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
    );
};

export default AddLesson;
