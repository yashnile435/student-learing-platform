import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { FaUser, FaUserGraduate, FaChalkboardTeacher, FaBook, FaMoneyBillWave, FaExchangeAlt, FaClock } from 'react-icons/fa';
import { db } from '../../firebase';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        users: { total: 0, students: 0, teachers: 0 },
        courses: { total: 0, free: 0, paid: 0 },
        financials: { totalRevenue: 0, totalTransactions: 0, submitted: 0, verified: 0, accessGranted: 0 },
        enrollments: { total: 0, mostPopular: [] },
        recentActivity: []
    });

    useEffect(() => {
        fetchAllReportData();
    }, []);

    const fetchAllReportData = async () => {
        setLoading(true);
        try {
            // Parallel Fetching
            const [usersSnap, coursesSnap, transactionsSnap] = await Promise.all([
                getDocs(collection(db, 'users')),
                getDocs(collection(db, 'courses')),
                getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')))
            ]);

            // 1. Process Users
            const users = usersSnap.docs.map(doc => doc.data());
            const userStats = users.reduce((acc, user) => {
                acc.total++;
                if (user.role === 'teacher') acc.teachers++;
                else if (user.role === 'student') acc.students++;
                return acc;
            }, { total: 0, students: 0, teachers: 0 });

            // 2. Process Courses
            const courses = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const courseStats = courses.reduce((acc, course) => {
                acc.total++;
                if (course.isFree) acc.free++; else acc.paid++;
                return acc;
            }, { total: 0, free: 0, paid: 0 });

            // 3. Process Transactions (Financials & Activity)
            const transactions = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const financeStats = transactions.reduce((acc, txn) => {
                acc.totalTransactions++;

                // Status Counts
                if (txn.status === 'submitted') acc.submitted++;
                else if (txn.status === 'verified') acc.verified++;
                else if (['access_granted', 'approved'].includes(txn.status)) acc.accessGranted++;

                // Revenue (Verified/Access Granted)
                if (['verified', 'access_granted', 'approved'].includes(txn.status)) {
                    acc.totalRevenue += Number(txn.amount) || 0;
                }
                return acc;
            }, { totalRevenue: 0, totalTransactions: 0, submitted: 0, verified: 0, accessGranted: 0 });

            // 4. Enrollment Analysis (Most Popular)
            // Strategy: Count Course IDs in User's 'purchasedCourses' arrays
            const courseRefMap = {}; // id -> count
            let totalEnrollments = 0;

            users.forEach(user => {
                if (user.purchasedCourses && Array.isArray(user.purchasedCourses)) {
                    totalEnrollments += user.purchasedCourses.length;
                    user.purchasedCourses.forEach(cId => {
                        courseRefMap[cId] = (courseRefMap[cId] || 0) + 1;
                    });
                }
            });

            // Map Counts to Course Titles
            const popularCourses = Object.keys(courseRefMap)
                .map(cId => {
                    const course = courses.find(c => c.id === cId);
                    return {
                        title: course ? course.title : 'Unknown Course',
                        count: courseRefMap[cId]
                    };
                })
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5

            setStats({
                users: userStats,
                courses: courseStats,
                financials: financeStats,
                enrollments: { total: totalEnrollments, mostPopular: popularCourses },
                recentActivity: transactions.slice(0, 5) // Last 5 transactions
            });

        } catch (error) {
            console.error("Error generating reports:", error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.text("YaTi Learning - Executive Report", 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);
        doc.line(20, 32, 190, 32);

        let y = 45;

        // Section: Users
        doc.setFontSize(16); doc.text("User Metrics", 20, y); y += 10;
        doc.setFontSize(12);
        doc.text(`Total Users: ${stats.users.total}`, 25, y); y += 8;
        doc.text(`Students: ${stats.users.students}`, 25, y); y += 8;
        doc.text(`Teachers: ${stats.users.teachers}`, 25, y); y += 15;

        // Section: Finances
        doc.setFontSize(16); doc.text("Financial Metrics", 20, y); y += 10;
        doc.setFontSize(12);
        doc.text(`Total Revenue: Rs. ${stats.financials.totalRevenue}`, 25, y); y += 8;
        doc.text(`Total Transactions: ${stats.financials.totalTransactions}`, 25, y); y += 8;
        doc.text(`(Verified/Granted): ${stats.financials.verified + stats.financials.accessGranted}`, 25, y); y += 15;

        // Section: Courses
        doc.setFontSize(16); doc.text("Course Metrics", 20, y); y += 10;
        doc.setFontSize(12);
        doc.text(`Total Enrollments: ${stats.enrollments.total}`, 25, y); y += 8;
        doc.text(`Active Courses: ${stats.courses.total} (${stats.courses.free} Free, ${stats.courses.paid} Paid)`, 25, y); y += 15;

        doc.save("yati_comprehensive_report.pdf");
    };

    if (loading) return <div className="p-4">Loading Comprehensive Report...</div>;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ margin: 0 }}>Platform Overview</h1>
                <button onClick={generatePDF} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Generate PDF
                </button>
            </div>

            {/* 1. User Metrics */}
            <h3 className="section-title" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>User Statistics</h3>
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="card stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#e0e7ff', padding: '1rem', borderRadius: '50%', color: '#4f46e5' }}><FaUser size={24} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.users.total}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Total Users</div>
                    </div>
                </div>
                <div className="card stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '50%', color: '#16a34a' }}><FaUserGraduate size={24} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.users.students}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Students</div>
                    </div>
                </div>
                <div className="card stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#fef9c3', padding: '1rem', borderRadius: '50%', color: '#ca8a04' }}><FaChalkboardTeacher size={24} /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.users.teachers}</div>
                        <div style={{ color: 'var(--text-muted)' }}>Teachers</div>
                    </div>
                </div>
            </div>

            {/* 2. Course & Enrollment Metrics */}
            <h3 className="section-title" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Content & Engagement</h3>
            <div className="stats-grid" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Course Inventory</h3>
                        <FaBook style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{stats.courses.total}</div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                        <span className="badge badge-free">{stats.courses.free} Free</span>
                        <span className="badge badge-paid">{stats.courses.paid} Paid</span>
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Total Enrollments</h3>
                        <FaUserGraduate style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{stats.enrollments.total}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Across all students</p>
                </div>
            </div>

            {/* 3. Financial Metrics */}
            <h3 className="section-title" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Financial Performance</h3>
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary-color) 0%, #4338ca 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Revenue</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>₹{stats.financials.totalRevenue.toLocaleString()}</div>
                        </div>
                        <FaMoneyBillWave size={30} style={{ opacity: 0.8 }} />
                    </div>
                </div>

                <div className="card">
                    <h4 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Transaction Status</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Submitted (Pending)</span>
                            <span className="badge badge-free" style={{ background: '#fff7ed', color: '#c2410c' }}>{stats.financials.submitted}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Verified / Granted</span>
                            <span className="badge badge-paid">{stats.financials.verified + stats.financials.accessGranted}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>Total Requests</span>
                            <span>{stats.financials.totalTransactions}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. Detailed Lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem' }}>

                {/* Most Popular Courses */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaBook style={{ color: 'var(--primary-color)' }} /> Most Popular Courses
                    </h3>
                    {stats.enrollments.mostPopular.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No enrollment data available.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {stats.enrollments.mostPopular.map((course, idx) => (
                                    <tr key={idx} style={{ borderBottom: idx !== stats.enrollments.mostPopular.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                        <td style={{ padding: '0.75rem 0' }}>{idx + 1}. {course.title}</td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 600 }}>{course.count} Students</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Recent Transactions Activity */}
                <div className="card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FaClock style={{ color: 'var(--primary-color)' }} /> Recent Transactions
                    </h3>
                    {stats.recentActivity.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No recent activity.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {stats.recentActivity.map(txn => (
                                <div key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{txn.userName || txn.userEmail}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{txn.courseName}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--success-color)' }}>+₹{txn.amount}</div>
                                        <div style={{ fontSize: '0.75rem' }} className={`badge ${['verified', 'access_granted'].includes(txn.status) ? 'badge-paid' : 'badge-free'}`}>
                                            {txn.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Reports;
