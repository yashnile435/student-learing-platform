import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { submitManualPayment } from '../services/paymentService';

const Checkout = () => {
    const { user, userData } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('review'); // review, qr_payment, processing, success, error
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Get course from location state
    const course = location.state?.course;

    useEffect(() => {
        if (!course) {
            navigate('/courses');
        }
    }, [course, navigate]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleShowQR = () => {
        setStatus('qr_payment');
    };

    const handlePaymentSubmitted = async () => {
        if (!user || !course) return;

        setLoading(true);
        setStatus('processing');
        setErrorMsg('');

        try {
            await submitManualPayment({
                userId: user.uid,
                userName: userData?.name || user.displayName || 'Unknown Student',
                courseId: course.id,
                courseName: course.title,
                amount: course.price
            });

            setStatus('success');
        } catch (error) {
            console.error("Payment submission failed:", error);
            setErrorMsg("Failed to submit payment. Please try again.");
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    if (!course) return null;

    return (
        <div className="auth-container" style={{ paddingTop: '100px', position: 'relative' }}>
            <div className="card auth-card" style={{ position: 'relative', maxWidth: '500px' }}>
                <button
                    onClick={handleGoBack}
                    style={{
                        position: 'absolute',
                        top: '1.5rem',
                        left: '1.5rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        zIndex: 10
                    }}
                    aria-label="Go back"
                >
                    <FaArrowLeft />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Back</span>
                </button>
                <h2 className="auth-title" style={{ marginTop: '1.5rem' }}>Checkout</h2>

                {status === 'review' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '20px', textAlign: 'left', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                            <h3>Order Summary</h3>
                            <p><strong>Course:</strong> {course.title}</p>
                            <p><strong>Duration:</strong> {course.duration} mins</p>
                            <hr style={{ margin: '10px 0', borderColor: '#ddd' }} />
                            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                Total: ₹{course.price}
                            </p>
                        </div>

                        <button
                            onClick={handleShowQR}
                            className="btn btn-primary full-width"
                        >
                            Confirm Purchase
                        </button>
                    </div>
                )}

                {status === 'qr_payment' && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            Scan the QR code below to pay <strong>₹{course.price}</strong>
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
                                <li>Pay the exact amount: <strong>₹{course.price}</strong>.</li>
                                <li>Come back here and click the button below.</li>
                            </ol>
                        </div>

                        <button
                            onClick={handlePaymentSubmitted}
                            className="btn btn-primary full-width"
                        >
                            Payment Completed
                        </button>
                    </div>
                )}

                {status === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <p>Submitting your payment...</p>
                        <small>Please do not close this window.</small>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '1rem' }}>✓</div>
                        <h3>Payment Submitted</h3>
                        <p style={{ margin: '1rem 0', color: '#666' }}>
                            Your payment is under review. Access will be granted after verification (usually within 24 hours).
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn btn-primary full-width"
                            style={{ marginTop: '1.5rem' }}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: '#dc3545', marginBottom: '1rem' }}>✕</div>
                        <h3>Submission Failed</h3>
                        <p>{errorMsg}</p>
                        <button
                            onClick={() => setStatus('qr_payment')}
                            className="btn btn-secondary full-width"
                            style={{ marginTop: '1.5rem' }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Checkout;
