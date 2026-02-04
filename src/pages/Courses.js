
import { collection, getDocs, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { enrollFreeCourse, submitManualPayment, uploadPaymentScreenshot } from '../services/paymentService'; // Updated import
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
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [screenshotPreview, setScreenshotPreview] = useState(null);
    const [transactionId, setTransactionId] = useState('');

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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setScreenshotFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaymentSubmit = async () => {
        if (!user || !selectedCourse) return;

        setPaymentStatus('processing');
        setPaymentError('');

        try {
            let screenshotUrl = null;
            if (screenshotFile) {
                screenshotUrl = await uploadPaymentScreenshot(screenshotFile, user.uid);
            }

            await submitManualPayment({
                userId: user.uid,
                userName: userData?.name || user.displayName || 'Unknown Student',
                userEmail: user.email,
                courseId: selectedCourse.id,
                courseName: selectedCourse.title,
                amount: selectedCourse.price,
                screenshotUrl: screenshotUrl,
                transactionId: transactionId.trim()
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
        setScreenshotFile(null);
        setScreenshotPreview(null);
        setTransactionId('');
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
                    <div className="card" style={{ width: '90%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button
                            onClick={closePaymentModal}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666' }}
                        >
                            <FaTimes />
                        </button>

                        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Complete Payment</h2>
                        <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>
                            Pay <strong>₹{selectedCourse.price}</strong> for <strong>{selectedCourse.title}</strong>
                        </p>

                        {paymentStatus === 'initial' && (
                            <div>
                                {/* QR Code Section */}
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        border: '2px solid #eee',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        marginBottom: '1rem',
                                        display: 'inline-block'
                                    }}>
                                        <img
                                            src="/QR.jpeg"
                                            alt="Payment QR Code"
                                            style={{ width: '200px', height: '200px', objectFit: 'contain' }}
                                        />
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                                        Scan QR with any UPI app and pay <strong>₹{selectedCourse.price}</strong>
                                    </p>
                                </div>

                                {/* Transaction ID Input */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Transaction ID <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Enter UPI Transaction ID"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                    <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                        Enter the transaction ID from your payment app
                                    </small>
                                </div>

                                {/* Screenshot Upload */}
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                                        Payment Screenshot <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ width: '100%' }}
                                    />
                                    {screenshotPreview && (
                                        <div style={{ marginTop: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', padding: '5px' }}>
                                            <img src={screenshotPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', display: 'block' }} />
                                        </div>
                                    )}
                                    <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                        Upload a clear screenshot of your payment confirmation
                                    </small>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handlePaymentSubmit}
                                    className="btn btn-primary full-width"
                                    disabled={!transactionId.trim() || !screenshotFile}
                                    style={{ opacity: (!transactionId.trim() || !screenshotFile) ? 0.5 : 1 }}
                                >
                                    Submit Payment
                                </button>

                                {(!transactionId.trim() || !screenshotFile) && (
                                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#999', marginTop: '0.5rem' }}>
                                        Please enter transaction ID and upload screenshot
                                    </p>
                                )}
                            </div>
                        )}

                        {paymentStatus === 'processing' && (
                            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                                <p>Submitting payment...</p>
                            </div>
                        )}

                        {paymentStatus === 'success' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '1rem' }}>✓</div>
                                <h3>Payment Submitted</h3>
                                <p style={{ margin: '1rem 0', color: '#666' }}>
                                    Payment submitted successfully. Access will be granted after admin verification.
                                </p>
                                <button onClick={closePaymentModal} className="btn btn-secondary full-width">
                                    Close
                                </button>
                            </div>
                        )}

                        {paymentStatus === 'error' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }}>✕</div>
                                <h3>Submission Failed</h3>
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
