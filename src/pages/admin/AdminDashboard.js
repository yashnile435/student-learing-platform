
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaUserGraduate, FaUserShield, FaBook, FaChalkboardTeacher, FaPlus, FaEdit, FaChartBar, FaCheck } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { getPendingPayments, approveManualPayment } from '../../services/paymentService';
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
        } catch (error) {
            console.error("Approval failed:", error);
            alert("Failed to approve payment. check console.");
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
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#059669', marginBottom: '0.5rem' }}>
                                        ₹{payment.amount}
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                                        onClick={() => handleApprovePayment(payment)}
                                    >
                                        <FaCheck /> Approve
                                    </button>
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
        </div>
    );
};

export default AdminDashboard;

