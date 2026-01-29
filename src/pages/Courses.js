import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CourseProgressCard from '../components/CourseProgressCard';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { enrollFreeCourse } from '../services/paymentService';
import '../styles/Dashboard.css';
import '../styles/Home.css';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null); // Track which course is currently enrolling
    const { user, userData } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fetch actual courses
                const q = query(collection(db, 'courses')); // Could add orderBy('createdAt') if indexed
                const querySnapshot = await getDocs(q);
                const fetchedCourses = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setCourses(fetchedCourses);
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    const isEnrolled = (courseId) => {
        if (!user || !userData) return false;
        // Admins have access to everything, essentially "enrolled"
        if (userData.role === 'admin') return true; 
        return userData.purchasedCourses?.includes(courseId);
    };

    const handleCourseClick = async (course) => {
        if (!user) {
            navigate('/signup');
            return;
        }

        // 1. If already enrolled, go to Dashboard (Course View)
        if (isEnrolled(course.id)) {
            navigate('/dashboard', { state: { courseId: course.id } });
            return;
        }

        // 2. If Review/Purchasing Logic
        if (course.isFree) {
            // Free Course: Auto-Enroll
            setEnrollingId(course.id);
            try {
                await enrollFreeCourse(user.uid, course.id);
                // Navigate after success
                navigate('/dashboard', { state: { courseId: course.id } });
            } catch (error) {
                alert("Failed to enroll. Please try again.");
            } finally {
                setEnrollingId(null);
            }
        } else {
            // Paid Course: Go to Checkout
            navigate('/checkout', { state: { course } });
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Loading Courses...</p>
            </div>
        );
    }

    return (
        <div className="home-container" style={{paddingTop: '80px'}}>
            <div className="container">
                <div style={{textAlign: 'center', marginBottom: '3rem'}}>
                    <h1>Explore Our Courses</h1>
                    <p className="hero-subtitle" style={{color: 'var(--text-muted)'}}>
                        Discover a wide range of programming and tech courses designed to boost your career.
                    </p>
                </div>

                <div className="video-grid">
                    {courses.map(course => (
                        <div key={course.id} className="course-wrapper" style={{position: 'relative'}}>
                            {enrollingId === course.id && (
                                <div className="overlay-loading" style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(255,255,255,0.8)', zIndex: 10,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '16px'
                                }}>
                                    <div className="spinner"></div>
                                </div>
                            )}
                            <CourseProgressCard 
                                course={course} 
                                onClick={handleCourseClick}
                                hideProgress={true}
                            />
                        </div>
                    ))}
                    
                    {courses.length === 0 && (
                       <div style={{textAlign: 'center', width: '100%'}}>
                           <h3>No courses available at the moment.</h3>
                           <p>Please check back later.</p>
                       </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Courses;
