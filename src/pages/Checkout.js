
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { completePurchaseMock, initiatePurchase } from '../services/paymentService';
import '../styles/Auth.css'; // Reusing simple card style

const Checkout = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('review'); // review, processing, success, error
    const [errorMsg, setErrorMsg] = useState('');

    const course = state?.course;

    useEffect(() => {
        if (!course || !user) {
            navigate('/courses');
        }
    }, [course, user, navigate]);

    const handlePurchase = async () => {
        setLoading(true);
        setStatus('processing');
        setErrorMsg('');

        try {
            // 1. Create Purchase Record
            const purchaseId = await initiatePurchase(user.uid, course.id, course.price);

            // 2. Simulate Payment Gateway Delay
            setTimeout(async () => {
                try {
                    // 3. Complete Purchase (Simulating Server-Side Success)
                    await completePurchaseMock(purchaseId, user.uid, course.id);

                    setStatus('success');
                } catch (err) {
                    console.error(err);
                    setStatus('error');
                    setErrorMsg('Payment verification failed.');
                } finally {
                    setLoading(false);
                }
            }, 2000); // 2 second delay to simulate processing

        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg('Could not initiate purchase.');
            setLoading(false);
        }
    };

    if (!course) return null;

    return (
        <div className="auth-container" style={{ paddingTop: '100px' }}>
            <div className="card auth-card">
                <h2 className="auth-title">Checkout</h2>

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

                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Payment Gateway is currently in <strong>Demo Mode</strong>. No actual charge will be made.
                        </p>

                        <button
                            onClick={handlePurchase}
                            disabled={loading}
                            className="btn btn-primary full-width"
                        >
                            {loading ? 'Processing...' : 'Confirm Purchase'}
                        </button>
                    </div>
                )}

                {status === 'processing' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                        <p>Processing your payment...</p>
                        <small>Please do not close this window.</small>
                    </div>
                )}

                {status === 'success' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: '#28a745', marginBottom: '1rem' }}>✓</div>
                        <h3>Payment Successful!</h3>
                        <p>You now have full access to <strong>{course.title}</strong>.</p>
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
                        <h3>Payment Failed</h3>
                        <p>{errorMsg}</p>
                        <button
                            onClick={() => setStatus('review')}
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
