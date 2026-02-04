
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { enrollFreeCourse } from '../services/paymentService';
import '../index.css';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [error, setError] = useState('');
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const q = query(collection(db, 'courses'));
                const querySnapshot = await getDocs(q);
                const fetchedCourses = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCourses(fetchedCourses);
            } catch (err) {
                console.error("Error fetching courses:", err);
                setError("Failed to load courses. Please check your internet connection.");
                if (err.code === 'permission-denied') {
                    setError("Access to courses was denied. Please check Firestore Security Rules.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const isEnrolled = (courseId) => {
        if (!user || !userData) return false;
        if (userData.role === 'admin') return true;
        return userData.purchasedCourses?.includes(courseId);
    };

    const handleCourseClick = async (course) => {
        if (!user) {
            navigate('/login', {
                state: {
                    from: location.pathname,
                    courseId: course.id,
                    action: 'enroll_resume'
                }
            });
            return;
        }
        if (isEnrolled(course.id)) {
            navigate('/dashboard', { state: { courseId: course.id } });
            return;
        }

        if (course.isFree) {
            setEnrollingId(course.id);
            try {
                await enrollFreeCourse(user.uid, course.id);
                navigate('/dashboard', { state: { courseId: course.id } });
            } catch (error) {
                alert("Failed to enroll. Please try again.");
            } finally {
                setEnrollingId(null);
            }
        } else {
            navigate('/checkout', { state: { course } });
        }
    };

    useEffect(() => {
        if (!loading && user && location.state?.action === 'enroll_resume' && location.state?.courseId) {
            const courseToResume = courses.find(c => c.id === location.state.courseId);
            if (courseToResume) {
                // Automatically resume the action
                handleCourseClick(courseToResume);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user, courses]); // depend on courses to ensure they are loaded

    if (loading) {
        return <div className="p-4 text-center">Loading Courses...</div>;
    }

    if (error) {
        return (
            <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <h3 style={{ color: 'var(--danger-color)' }}>{error}</h3>
                <button className="btn btn-primary mt-4" onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '3rem 1rem' }}>
            <div className="text-center mb-4">
                <h1>Explore Courses</h1>
                <p>Discover new skills and advance your career.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                {courses.map(course => (
                    <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '200px', background: '#e5e7eb' }}>
                            <img
                                src={course.thumbnail || 'https://via.placeholder.com/400x250'}
                                alt={course.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div className="flex justify-between items-center mb-2">
                                <span className={`badge ${course.isFree ? 'badge-free' : 'badge-paid'}`}>
                                    {course.isFree ? 'FREE' : `₹${course.price}`}
                                </span>
                            </div>
                            <h3 style={{ marginBottom: '0.5rem' }}>{course.title}</h3>
                            <p style={{ flex: 1, fontSize: '0.9rem' }}>
                                {course.description?.substring(0, 100)}...
                            </p>

                            <button
                                className="btn btn-primary w-full mt-4"
                                onClick={() => handleCourseClick(course)}
                                disabled={enrollingId === course.id}
                            >
                                {enrollingId === course.id ? 'Enrolling...' : (isEnrolled(course.id) ? 'Go to Course' : (course.isFree ? 'Enroll Now' : 'Buy Now'))}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {courses.length === 0 && (
                <div style={{ textAlign: 'center', width: '100%', padding: '3rem' }}>
                    <h3>No courses available at the moment.</h3>
                </div>
            )}
        </div>
    );
};

export default Courses;
