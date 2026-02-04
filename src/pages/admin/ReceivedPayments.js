import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaImage, FaKey, FaShieldAlt } from 'react-icons/fa';
import { getPendingPayments, verifyManualPayment, grantAccessManualPayment, rejectManualPayment } from '../../services/paymentService';
import '../../index.css';

const ReceivedPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewScreenshot, setViewScreenshot] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await getPendingPayments();
            setPayments(data);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (payment) => {
        if (!window.confirm(`Verify payment for ${payment.userName}? This does NOT grant access yet.`)) return;

        setProcessingId(payment.id);
        try {
            await verifyManualPayment(payment.id);
            // Update local state to reflect verification
            setPayments(prev => prev.map(p =>
                p.id === payment.id ? { ...p, status: 'verified' } : p
            ));
        } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to verify payment.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleGrantAccess = async (payment) => {
        if (!window.confirm(`Grant FINAL course access to ${payment.userName}?`)) return;

        setProcessingId(payment.id);
        try {
            await grantAccessManualPayment(payment.id, payment.userId, payment.courseId);
            // Remove from list as it's fully processed
            setPayments(prev => prev.filter(p => p.id !== payment.id));
            alert(`Access granted to ${payment.userName}`);
        } catch (error) {
            console.error("Granting access failed:", error);
            alert("Failed to grant access.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (payment) => {
        if (!window.confirm(`Reject payment from ${payment.userName}?`)) return;

        setProcessingId(payment.id);
        try {
            await rejectManualPayment(payment.id);
            setPayments(prev => prev.filter(p => p.id !== payment.id));
            alert(`Payment rejected for ${payment.userName}`);
        } catch (error) {
            console.error("Rejection failed:", error);
            alert("Failed to reject payment.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return <div className="p-4">Loading payments...</div>;
    }

    return (
        <div>
            <h1 className="mb-4">Received Payments</h1>

            {payments.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#666' }}>No Pending Payments</h3>
                    <p style={{ color: '#999' }}>All submission requests have been processed.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Student details</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Course & Transaction</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Screenshot</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map(payment => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{payment.userName}</div>
                                        <div style={{ fontSize: '0.875rem', color: '#666' }}>{payment.userEmail || 'N/A'}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                                            {payment.timestamp ? new Date(payment.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{payment.courseName}</div>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            background: '#f1f5f9',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.875rem',
                                            display: 'inline-block'
                                        }}>
                                            {payment.transactionId || 'N/A'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {payment.screenshotUrl ? (
                                            <button
                                                onClick={() => setViewScreenshot(payment.screenshotUrl)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#2563eb',
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    textDecoration: 'underline'
                                                }}
                                            >
                                                <FaImage /> View
                                            </button>
                                        ) : (
                                            <span style={{ color: '#aaa', fontSize: '0.875rem' }}>No screenshot</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span className="badge" style={{
                                            background: payment.status === 'verified' ? '#dcfce7' : '#fff7ed',
                                            color: payment.status === 'verified' ? '#166534' : '#c2410c',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            textTransform: 'uppercase'
                                        }}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                                            {payment.status === 'submitted' && (
                                                <button
                                                    className="btn"
                                                    onClick={() => handleVerify(payment)}
                                                    disabled={processingId === payment.id}
                                                    style={{
                                                        backgroundColor: '#f59e0b',
                                                        borderColor: '#f59e0b',
                                                        color: '#fff',
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        fontSize: '0.85rem',
                                                        padding: '0.4rem'
                                                    }}
                                                >
                                                    <FaShieldAlt /> Verify Payment
                                                </button>
                                            )}

                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleGrantAccess(payment)}
                                                disabled={processingId === payment.id || payment.status !== 'verified'}
                                                style={{
                                                    backgroundColor: payment.status === 'verified' ? '#10b981' : '#ccc',
                                                    borderColor: payment.status === 'verified' ? '#10b981' : '#ccc',
                                                    cursor: payment.status === 'verified' ? 'pointer' : 'not-allowed',
                                                    width: '100%',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    fontSize: '0.85rem',
                                                    padding: '0.4rem'
                                                }}
                                            >
                                                <FaKey /> Grant Access
                                            </button>

                                            <button
                                                className="btn"
                                                onClick={() => handleReject(payment)}
                                                disabled={processingId === payment.id}
                                                style={{
                                                    background: 'none',
                                                    color: '#dc2626',
                                                    border: '1px solid #dc2626',
                                                    width: '100%',
                                                    fontSize: '0.85rem',
                                                    padding: '0.3rem'
                                                }}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Screenshot Modal (Unchanged) */}
            {viewScreenshot && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 9999,
                        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem'
                    }}
                    onClick={() => setViewScreenshot(null)}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img
                            src={viewScreenshot}
                            alt="Payment Screenshot"
                            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}
                        />
                        <button
                            onClick={() => setViewScreenshot(null)}
                            style={{
                                position: 'absolute', top: -40, right: 0, background: 'white', border: 'none', color: '#333',
                                fontSize: '1.5rem', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReceivedPayments;
