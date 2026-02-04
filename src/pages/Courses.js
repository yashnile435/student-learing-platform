
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { enrollFreeCourse, submitManualPayment } from '../services/paymentService'; // Updated import
import '../index.css';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState(null);
    const [error, setError] = useState('');

    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, processing, success, error
    const [paymentError, setPaymentError] = useState('');

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
            // Open Payment Modal instead of navigating to Checkout
            setSelectedCourse(course);
            setPaymentStatus('initial');
            setPaymentError('');
            setShowPaymentModal(true);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!user || !selectedCourse) return;

        setPaymentStatus('processing');
        setPaymentError('');

        try {
            await submitManualPayment({
                userId: user.uid,
                userName: userData?.name || user.displayName || 'Unknown Student',
                courseId: selectedCourse.id,
                courseName: selectedCourse.title,
                amount: selectedCourse.price
            });
            setPaymentStatus('success');
        } catch (error) {
            console.error("Payment submission failed:", error);
            setPaymentError("Failed to submit payment. Please try again.");
            setPaymentStatus('error');
        }
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedCourse(null);
        setPaymentStatus('initial');
    };

    useEffect(() => {
        if (!loading && user && location.state?.action === 'enroll_resume' && location.state?.courseId) {
            const courseToResume = courses.find(c => c.id === location.state.courseId);
            if (courseToResume) {
                handleCourseClick(courseToResume);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user, courses]);

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

            {/* Payment Modal */}
            {showPaymentModal && selectedCourse && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '450px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={closePaymentModal}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666' }}
                        >
                            <FaTimes />
                        </button>

                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Confirm Purchase</h2>

                        {paymentStatus === 'initial' && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '1rem', color: '#666' }}>
                                    Scan QR code to pay <strong>₹{selectedCourse.price}</strong> for <strong>{selectedCourse.title}</strong>
                                </p>
                                <div style={{
                                    border: '2px solid #eee',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    marginBottom: '1.5rem',
                                    display: 'inline-block'
                                }}>
                                    <img
                                        src="/QR.jpeg"
                                        alt="Payment QR Code"
                                        style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'left', background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Instructions:</p>
                                    <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
                                        <li>Scan QR with any UPI app.</li>
                                        <li>Pay exact amount: <strong>₹{selectedCourse.price}</strong>.</li>
                                        <li>Click 'Payment Completed' below.</li>
                                    </ol>
                                </div>
                                <button onClick={handlePaymentSubmit} className="btn btn-primary full-width">
                                    Payment Completed
                                </button>
                            </div>
                        )}

                        {paymentStatus === 'processing' && (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                                <p>Verifying submission...</p>
                            </div>
                        )}

                        {paymentStatus === 'success' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '1rem' }}>✓</div>
                                <h3>Payment Submitted</h3>
                                <p style={{ margin: '1rem 0', color: '#666' }}>
                                    Your payment is under review. Access will be granted shortly after admin approval.
                                </p>
                                <button onClick={closePaymentModal} className="btn btn-secondary full-width">
                                    Close
                                </button>
                            </div>
                        )}

                        {paymentStatus === 'error' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }}>✕</div>
                                <h3>Failed</h3>
                                <p>{paymentError}</p>
                                <button onClick={() => setPaymentStatus('initial')} className="btn btn-secondary full-width mt-3">
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Courses;
