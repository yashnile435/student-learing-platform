
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../../firebase';
import '../../styles/Admin.css';

const CreateCourse = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [coursePrice, setCoursePrice] = useState('');
    const [courseIsFree, setCourseIsFree] = useState(false);
    const [courseThumbnail, setCourseThumbnail] = useState('');
    const [courseVideoId, setCourseVideoId] = useState('');

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

    return (
        <form onSubmit={handleCreateCourse}>
            <h1 className="mb-4">Create New Course</h1>
            {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

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

            <div className="form-group">
                <label className="form-label">Intro Video ID (Youtube)</label>
                <input className="form-input" value={courseVideoId} onChange={handleVideoIdChange} placeholder="e.g. dQw4w9WgXcQ or Full URL" />
                <small style={{color: '#666'}}>Used for preview thumbnail if Custom Thumbnail is empty.</small>
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
    );
};

export default CreateCourse;
