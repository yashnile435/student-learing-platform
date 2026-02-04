import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaUserGraduate, FaUserShield, FaBook, FaChalkboardTeacher, FaPlus, FaEdit, FaChartBar, FaCheck, FaTimes, FaRupeeSign } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getPendingPayments, approveManualPayment, rejectManualPayment, getAllPayments } from '../../services/paymentService';
import '../../index.css';

const AdminDashboard = () => {
    const { user, userRole } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalAdmins: 0,
        totalTeachers: 0,
        totalCourses: 0,
        teacherCourses: 0
    });
    const [pendingPayments, setPendingPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentAnalytics, setPaymentAnalytics] = useState({
        totalRevenue: 0,
        totalPayments: 0,
        approved: 0,
        rejected: 0,
        pending: 0
    });
    const [viewScreenshot, setViewScreenshot] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            try {
                if (userRole === 'teacher') {
                    // Teacher View Stats
                    const q = query(collection(db, 'courses'), where('teacherId', '==', user.uid));
                    const snap = await getCountFromServer(q);
                    setStats(prev => ({ ...prev, teacherCourses: snap.data().count }));
                } else {
                    // Admin View Stats
                    const studentsSnap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student')));
                    const adminsSnap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin')));
                    const teachersSnap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'teacher')));
                    const coursesSnap = await getCountFromServer(collection(db, 'courses'));

                    setStats({
                        totalStudents: studentsSnap.data().count,
                        totalAdmins: adminsSnap.data().count,
                        totalTeachers: teachersSnap.data().count,
                        totalCourses: coursesSnap.data().count,
                        teacherCourses: 0
                    });

                    // Fetch Pending Payments
                    const payments = await getPendingPayments();
                    setPendingPayments(payments);

                    // Fetch All Payments for Analytics
                    const allPayments = await getAllPayments();
                    const analytics = allPayments.reduce((acc, curr) => {
                        acc.totalPayments++;
                        if (curr.status === 'approved') {
                            acc.approved++;
                            acc.totalRevenue += Number(curr.amount) || 0;
                        } else if (curr.status === 'rejected') {
                            acc.rejected++;
                        } else if (curr.status === 'pending') {
                            acc.pending++;
                        }
                        return acc;
                    }, { totalRevenue: 0, totalPayments: 0, approved: 0, rejected: 0, pending: 0 });

                    setPaymentAnalytics(analytics);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, userRole]);

    const handleApprovePayment = async (payment) => {
        if (!window.confirm(`Approve access for ${payment.userName}?`)) return;

        try {
            await approveManualPayment(payment.id, payment.userId, payment.courseId);
            setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
            alert(`Approved access for ${payment.userName}`);

            // Update analytics locally
            setPaymentAnalytics(prev => ({
                ...prev,
                approved: prev.approved + 1,
                pending: prev.pending - 1,
                totalRevenue: prev.totalRevenue + Number(payment.amount)
            }));
        } catch (error) {
            console.error("Approval failed:", error);
            alert("Failed to approve payment. check console.");
        }
    };

    const handleRejectPayment = async (payment) => {
        if (!window.confirm(`Reject payment from ${payment.userName}?`)) return;

        try {
            await rejectManualPayment(payment.id);
            setPendingPayments(prev => prev.filter(p => p.id !== payment.id));
            alert(`Rejected payment from ${payment.userName}`);
            // Update analytics locally
            setPaymentAnalytics(prev => ({
                ...prev,
                rejected: prev.rejected + 1,
                pending: prev.pending - 1
            }));
        } catch (error) {
            console.error("Rejection failed:", error);
            alert("Failed to reject payment.");
        }
    };

    if (loading) return <div><p>Loading dashboard...</p></div>;

    // Teacher View
    if (userRole === 'teacher') {
        return (
            <div>
                <h1 className="mb-4">Instructor Dashboard</h1>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                            <FaChalkboardTeacher />
                        </div>
                        <div className="stat-info">
                            <h3>My Assigned Courses</h3>
                            <p>{stats.teacherCourses}</p>
                        </div>
                    </div>
                </div>

                <h2 className="mb-3">Quick Actions</h2>
                <div className="stats-grid">
                    <Link to="/admin/edit" className="card flex-center flex-col" style={{ gap: '1rem', transition: '0.2s', cursor: 'pointer' }}>
                        <div style={{ fontSize: '2rem', color: 'var(--primary-color)' }}><FaEdit /></div>
                        <h3>Manage My Courses</h3>
                    </Link>
                    <Link to="/admin/add-lesson" className="card flex-center flex-col" style={{ gap: '1rem', transition: '0.2s', cursor: 'pointer' }}>
                        <div style={{ fontSize: '2rem', color: 'var(--secondary-color)' }}><FaPlus /></div>
                        <h3>Add New Lesson</h3>
                    </Link>
                </div>
            </div>
        );
    }

    // Admin View
    return (
        <div>
            <h1 className="mb-4">Admin Dashboard</h1>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <FaUserGraduate />
                    </div>
                    <div className="stat-info">
                        <h3>Total Students</h3>
                        <p>{stats.totalStudents}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                        <FaChalkboardTeacher />
                    </div>
                    <div className="stat-info">
                        <h3>Total Teachers</h3>
                        <p>{stats.totalTeachers}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                        <FaUserShield />
                    </div>
                    <div className="stat-info">
                        <h3>Total Admins</h3>
                        <p>{stats.totalAdmins}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                        <FaBook />
                    </div>
                    <div className="stat-info">
                        <h3>Total Courses</h3>
                        <p>{stats.totalCourses}</p>
                    </div>
                </div>
            </div>

            {/* Payment Analytics */}
            <h2 className="mb-3 mt-4">Payment Analytics</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                        <FaRupeeSign />
                    </div>
                    <div className="stat-info">
                        <h3>Total Revenue</h3>
                        <p>₹{paymentAnalytics.totalRevenue}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fefce8', color: '#ca8a04' }}>
                        <FaChartBar />
                    </div>
                    <div className="stat-info">
                        <h3>Total Payments</h3>
                        <p>{paymentAnalytics.totalPayments}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        <FaCheck />
                    </div>
                    <div className="stat-info">
                        <h3>Approved</h3>
                        <p>{paymentAnalytics.approved}</p>
                    </div>
                </div>
            </div>

            {/* Pending Payments Section */}
            {pendingPayments.length > 0 && (
                <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    <h2 className="mb-3" style={{ color: '#d97706' }}>Pending Payments ({pendingPayments.length})</h2>
                    <div className="payment-list" style={{ display: 'grid', gap: '1rem' }}>
                        {pendingPayments.map(payment => (
                            <div key={payment.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{payment.courseName}</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                                        Student: <strong>{payment.userName}</strong>
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#999' }}>
                                        Date: {payment.timestamp ? new Date(payment.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                                    </p>
                                    {payment.screenshotUrl && (
                                        <button
                                            onClick={() => setViewScreenshot(payment.screenshotUrl)}
                                            style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginTop: '0.5rem', textDecoration: 'underline' }}
                                        >
                                            View Screenshot
                                        </button>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#059669', marginBottom: '0.5rem' }}>
                                        ₹{payment.amount}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                            onClick={() => handleApprovePayment(payment)}
                                        >
                                            <FaCheck /> Approve
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#dc2626', color: 'white' }}
                                            onClick={() => handleRejectPayment(payment)}
                                        >
                                            <FaTimes /> Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <h2 className="mb-3">Quick Actions</h2>
            <div className="stats-grid">
                <Link to="/admin/create" className="card flex-center flex-col" style={{ gap: '0.5rem', minHeight: '160px' }}>
                    <div style={{ fontSize: '2rem', color: '#2563eb' }}><FaPlus /></div>
                    <h3 style={{ fontSize: '1.1rem' }}>Create Course</h3>
                </Link>
                <Link to="/admin/create-teacher" className="card flex-center flex-col" style={{ gap: '0.5rem', minHeight: '160px' }}>
                    <div style={{ fontSize: '2rem', color: '#dc2626' }}><FaUserShield /></div>
                    <h3 style={{ fontSize: '1.1rem' }}>Create Teacher</h3>
                </Link>
                <Link to="/admin/edit" className="card flex-center flex-col" style={{ gap: '0.5rem', minHeight: '160px' }}>
                    <div style={{ fontSize: '2rem', color: '#059669' }}><FaEdit /></div>
                    <h3 style={{ fontSize: '1.1rem' }}>Manage Courses</h3>
                </Link>
                <Link to="/admin/reports" className="card flex-center flex-col" style={{ gap: '0.5rem', minHeight: '160px' }}>
                    <div style={{ fontSize: '2rem', color: '#d97706' }}><FaChartBar /></div>
                    <h3 style={{ fontSize: '1.1rem' }}>View Reports</h3>
                </Link>
                <Link to="/admin/manage-teachers" className="card flex-center flex-col" style={{ gap: '0.5rem', minHeight: '160px' }}>
                    <div style={{ fontSize: '2rem', color: '#7c3aed' }}><FaChalkboardTeacher /></div>
                    <h3 style={{ fontSize: '1.1rem' }}>Manage Teachers</h3>
                </Link>
            </div>

            {/* View Screenshot Modal */}
            {viewScreenshot && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center'
                }} onClick={() => setViewScreenshot(null)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={viewScreenshot} alt="Payment Screenshot" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '4px' }} />
                        <button onClick={() => setViewScreenshot(null)} style={{
                            position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: 'white', fontSize: '2rem', cursor: 'pointer'
                        }}>
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;

