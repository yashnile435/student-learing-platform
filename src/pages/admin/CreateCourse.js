import { useNavigate } from 'react-router-dom';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';

const CreateCourse = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [coursePrice, setCoursePrice] = useState('');
    const [courseIsFree, setCourseIsFree] = useState(false);
    const [courseThumbnail, setCourseThumbnail] = useState('');
    const [courseVideoId, setCourseVideoId] = useState('');

    // Teacher Assignment
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const q = query(collection(db, 'users'), where('role', '==', 'teacher'));
                const snap = await getDocs(q);
                const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeachers(list);
            } catch (err) {
                console.error("Error fetching teachers:", err);
            }
        };
        fetchTeachers();
    }, []);

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

    const resetForm = () => {
        setCourseTitle('');
        setCourseDesc('');
        setCoursePrice('');
        setCourseThumbnail('');
        setCourseVideoId('');
        setCourseIsFree(false);
        setSelectedTeacher('');
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
                videoId: courseVideoId.trim(),
                teacherId: selectedTeacher || null,
                totalLessons: 0,
                createdAt: new Date().toISOString()
            });

            setMessage('Course created successfully! Redirecting...');
            resetForm();

            setTimeout(() => {
                navigate('/admin/edit');
            }, 1000);

        } catch (error) {
            console.error("Error creating course:", error);
            const errStr = error.toString();
            if (errStr.includes('offline') || errStr.includes('network') || errStr.includes('fetch')) {
                setMessage('Network Error: Database connection failed. Please check your Ad Blocker or Internet connection.');
            } else {
                setMessage('Error creating course: ' + (error.message || 'Unknown error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="mb-4">Create New Course</h1>
            {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

            <div className="card admin-card">
                <form onSubmit={handleCreateCourse} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Course Title</label>
                        <input className="form-input" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required placeholder="e.g. Master React JS" />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Description</label>
                        <textarea className="form-input" style={{ minHeight: '100px' }} value={courseDesc} onChange={e => setCourseDesc(e.target.value)} required placeholder="What will students learn?" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Assign Teacher (Optional)</label>
                        <select
                            className="form-input"
                            value={selectedTeacher}
                            onChange={e => setSelectedTeacher(e.target.value)}
                        >
                            <option value="">-- Select a Teacher --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Price (₹)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={coursePrice}
                            onChange={e => setCoursePrice(e.target.value)}
                            disabled={courseIsFree}
                            placeholder={courseIsFree ? 'Free' : '0.00'}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Thumbnail URL</label>
                        <input className="form-input" value={courseThumbnail} onChange={e => setCourseThumbnail(e.target.value)} placeholder="https://..." />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Intro Video ID (Youtube)</label>
                        <input className="form-input" value={courseVideoId} onChange={handleVideoIdChange} placeholder="e.g. dQw4w9WgXcQ" />
                    </div>

                    {/* Checkbox and Button Full Width */}
                    <div className="form-group checkbox-group" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                        <input type="checkbox" id="isFree" checked={courseIsFree} onChange={e => setCourseIsFree(e.target.checked)} />
                        <label htmlFor="isFree" style={{ fontWeight: 600 }}>Is this a Free Course?</label>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ padding: '0.75rem', fontSize: '1rem' }}>
                            {loading ? 'Creating Course...' : 'Create Course'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default CreateCourse;
