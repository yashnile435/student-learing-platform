import { FaArrowLeft } from 'react-icons/fa';

// ...

const handleGoBack = () => {
    navigate(-1);
};

return (
    <div className="auth-container" style={{ paddingTop: '100px', position: 'relative' }}>
        <div className="card auth-card" style={{ position: 'relative' }}>
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
