import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FaUserGraduate, FaUserShield, FaBook } from 'react-icons/fa';
import { db } from '../../firebase';
import '../../styles/Admin.css'; // Reuse admin styles

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalAdmins: 0,
        totalCourses: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Students
                const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
                const studentsSnap = await getCountFromServer(studentsQuery);
                
                // Admins
                const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
                const adminsSnap = await getCountFromServer(adminsQuery);
                
                // Courses (All)
                const coursesColl = collection(db, 'courses');
                const coursesSnap = await getCountFromServer(coursesColl);

                setStats({
                    totalStudents: studentsSnap.data().count,
                    totalAdmins: adminsSnap.data().count,
                    totalCourses: coursesSnap.data().count
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
                // Fallback or retry logic could go here
                // For now, if count aggregation fails (e.g. indexes missing), we might handle headers differently
                // But simple counts usually work.
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-4"><p>Loading dashboard...</p></div>;
    
    return (
        <div>
            <h1 className="mb-4">Admin Dashboard</h1>
            
            <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="admin-card text-center">
                    <div style={{ fontSize: '2rem', color: '#2563eb', marginBottom: '1rem' }}>
                        <FaUserGraduate />
                    </div>
                    <h3>Total Students</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.totalStudents}</p>
                </div>

                <div className="admin-card text-center">
                     <div style={{ fontSize: '2rem', color: '#dc2626', marginBottom: '1rem' }}>
                        <FaUserShield />
                    </div>
                    <h3>Total Admins</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.totalAdmins}</p>
                </div>

                <div className="admin-card text-center">
                     <div style={{ fontSize: '2rem', color: '#059669', marginBottom: '1rem' }}>
                        <FaBook />
                    </div>
                    <h3>Total Courses</h3>
                    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>{stats.totalCourses}</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
