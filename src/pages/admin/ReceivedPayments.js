import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaImage, FaKey, FaShieldAlt } from 'react-icons/fa';
import { getPendingPayments, verifyManualPayment, grantAccessManualPayment, rejectManualPayment } from '../../utils/paymentService';
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
            // Update status to 'access_granted' instead of removing
            setPayments(prev => prev.map(p =>
                p.id === payment.id ? { ...p, status: 'access_granted' } : p
            ));
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
            // Update status to 'rejected' instead of removing
            setPayments(prev => prev.map(p =>
                p.id === payment.id ? { ...p, status: 'rejected' } : p
            ));
            alert(`Payment rejected for ${payment.userName}`);
        } catch (error) {
            console.error("Rejection failed:", error);
            alert("Failed to reject payment.");
        } finally {
            setProcessingId(null);
        }
    };

    // Helper for status badge styling
    const getStatusBadge = (status) => {
        const styles = {
            submitted: { bg: '#fff7ed', color: '#c2410c' },
            verified: { bg: '#dcfce7', color: '#166534' },
            access_granted: { bg: '#dbeafe', color: '#1e40af' },
            rejected: { bg: '#fee2e2', color: '#991b1b' },
            processing: { bg: '#fef9c3', color: '#854d0e' }
        };
        const style = styles[status] || styles.submitted;
        return (
            <span className="badge" style={{
                background: style.bg,
                color: style.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                border: `1px solid ${style.bg}`
            }}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    const PaymentActions = ({ payment }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
            {payment.status === 'submitted' && (
                <>
                    <button
                        className="btn"
                        onClick={() => handleVerify(payment)}
                        disabled={processingId === payment.id}
                        style={{
                            backgroundColor: '#f59e0b',
                            borderColor: '#f59e0b',
                            color: '#fff',
                            width: '100%',
                            fontSize: '0.85rem',
                            padding: '0.4rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                        }}
                    >
                        <FaShieldAlt /> Verify Payment
                    </button>
                    <button
                        className="btn"
                        onClick={() => handleReject(payment)}
                        disabled={processingId === payment.id}
                        style={{
                            background: 'none', color: '#dc2626', border: '1px solid #dc2626',
                            width: '100%', fontSize: '0.85rem', padding: '0.3rem'
                        }}
                    >
                        Reject
                    </button>
                </>
            )}

            {payment.status === 'verified' && (
                <>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGrantAccess(payment)}
                        disabled={processingId === payment.id}
                        style={{
                            backgroundColor: '#10b981', borderColor: '#10b981',
                            width: '100%', fontSize: '0.85rem', padding: '0.4rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'
                        }}
                    >
                        <FaKey /> Grant Access
                    </button>
                    <button
                        className="btn"
                        onClick={() => handleReject(payment)}
                        disabled={processingId === payment.id}
                        style={{
                            background: 'none', color: '#dc2626', border: '1px solid #dc2626',
                            width: '100%', fontSize: '0.85rem', padding: '0.3rem'
                        }}
                    >
                        Reject
                    </button>
                </>
            )}

            {(payment.status === 'access_granted' || payment.status === 'approved') && (
                <span style={{ color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaCheck /> Access Granted
                </span>
            )}

            {payment.status === 'rejected' && (
                <span style={{ color: '#dc2626', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FaTimes /> Rejected
                </span>
            )}
        </div>
    );

    if (loading) {
        return <div className="p-4">Loading payments...</div>;
    }

    return (
        <div>
            <h1 className="mb-4">All Payment Requests</h1>

            {payments.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#666' }}>No Payment Requests</h3>
                    <p style={{ color: '#999' }}>No payment records found.</p>
                </div>
            ) : (
                <>
                    {/* Desktop Table View */}
                    <div className="card hide-mobile" style={{ padding: 0, overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Student details</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Course & UTR Number</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map(payment => (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid #e2e8f0', background: payment.status === 'rejected' ? '#fffbfc' : 'white' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{payment.userName}</div>
                                            <div style={{ fontSize: '0.875rem', color: '#666' }}>{payment.userEmail || 'N/A'}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                                                {payment.timestamp ? new Date(payment.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{payment.courseName}</div>
                                            <div style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem', display: 'inline-block' }}>
                                                {payment.utrNumber || 'N/A'}
                                            </div>
                                            <div style={{ fontWeight: 600, color: 'var(--primary-color)', marginTop: '0.5rem' }}>₹{payment.amount}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            {getStatusBadge(payment.status)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', minWidth: '200px' }}>
                                            <PaymentActions payment={payment} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="show-mobile">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {payments.map(payment => (
                                <div key={payment.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{payment.userName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{payment.userEmail}</div>
                                        </div>
                                        {getStatusBadge(payment.status)}
                                    </div>

                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Course</div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{payment.courseName}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                                                {payment.utrNumber}
                                            </span>
                                            <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>₹{payment.amount}</span>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '0.75rem', color: '#999', textAlign: 'right' }}>
                                        {payment.timestamp ? new Date(payment.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                    </div>

                                    <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                        <PaymentActions payment={payment} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

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
