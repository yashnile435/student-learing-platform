
import { collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import '../../styles/Admin.css';

const ManageCourses = () => {
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
            {message && <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}
            
            {loading && <p>Loading...</p>}

            {!loading && coursesList.length === 0 ? <p>No courses found.</p> : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Lessons</th>
                                <th>Popularity</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coursesList.map(course => (
                                <tr key={course.id}>
                                    <td>{course.title}</td>
                                    <td>
                                        <span className={`badge ${course.isFree ? 'free' : 'premium'}`}>
                                            {course.isFree ? 'FREE' : 'PAID'}
                                        </span>
                                    </td>
                                    <td>{course.totalLessons || 0}</td>
                                    <td>{course.popularity || 0} views</td>
                                    <td>
                                        <button 
                                            onClick={() => handleDeleteCourse(course.id)}
                                            className="btn-delete"
                                        >
                                            Delete
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

export default ManageCourses;
