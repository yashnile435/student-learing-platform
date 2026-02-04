import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaUserGraduate, FaUserShield, FaBook, FaChalkboardTeacher, FaPlus, FaEdit, FaChartBar, FaCheck, FaTimes, FaRupeeSign } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getAllPayments } from '../../services/paymentService';
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
                    // Admin View Stats - Parallel Fetching
                    const [studentsSnap, adminsSnap, teachersSnap, coursesSnap, allPayments] = await Promise.all([
                        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student'))),
                        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'))),
                        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'teacher'))),
                        getCountFromServer(collection(db, 'courses')),
                        getAllPayments()
                    ]);

                    setStats({
                        totalStudents: studentsSnap.data().count,
                        totalAdmins: adminsSnap.data().count,
                        totalTeachers: teachersSnap.data().count,
                        totalCourses: coursesSnap.data().count,
                        teacherCourses: 0
                    });

                    // Filter pending specifically for 'submitted' status
                    const pendingRequests = allPayments.filter(p => p.status === 'submitted');
                    setPendingPayments(pendingRequests);

                    const analytics = allPayments.reduce((acc, curr) => {
                        acc.totalPayments++;

                        // Calculate Revenue and Approved Count
                        if (['access_granted', 'verified', 'approved'].includes(curr.status)) {
                            acc.approved++;
                            acc.totalRevenue += Number(curr.amount) || 0;
                        }

                        else if (curr.status === 'rejected') {
                            acc.rejected++;
                        }

                        else if (curr.status === 'submitted') {
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

            {/* Pending Payments Alert */}
            {pendingPayments.length > 0 && (
                <div style={{ marginTop: '2rem', marginBottom: '2rem', background: '#fff7ed', border: '1px solid #ffedd5', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#c2410c', fontSize: '1.25rem' }}>Pending Payments</h2>
                        <p style={{ margin: '0.5rem 0 0', color: '#9a3412' }}>
                            You have <strong>{pendingPayments.length}</strong> payment requests waiting for verification.
                        </p>
                    </div>
                    <Link to="/admin/received-payments" className="btn btn-primary" style={{ textDecoration: 'none', background: '#ea580c', borderColor: '#ea580c' }}>
                        Process Payments &rarr;
                    </Link>
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

