
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import '../../styles/Admin.css';

const EditCourse = () => {
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

    const resetForm = () => {
        setCourseTitle('');
        setCourseDesc('');
        setCoursePrice('');
        setCourseThumbnail('');
        setCourseVideoId('');
        setCourseIsFree(false);
        setEditCourseId('');
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
                setCourseVideoId(data.videoId || '');
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
                videoId: courseVideoId.trim(),
            });

            setMessage('Course updated successfully!');
        } catch (error) {
            console.error("Error updating course:", error);
            setMessage('Error updating course.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleUpdateCourse}>
            <h1 className="mb-4">Edit Course</h1>
            {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}

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

                    <div className="form-group">
                        <label className="form-label">Intro Video ID (Youtube)</label>
                        <input className="form-input" value={courseVideoId} onChange={handleVideoIdChange} />
                         <small style={{color: '#666'}}>Used for preview thumbnail if Custom Thumbnail is empty.</small>
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
    );
};

export default EditCourse;
