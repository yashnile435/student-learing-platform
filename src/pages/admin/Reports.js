
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { db } from '../../firebase';
import '../../styles/Admin.css';

const Reports = () => {
    const [stats, setStats] = useState({
        total: 0,
        free: 0,
        paid: 0,
        mostWatched: 'N/A',
        totalViews: 0
    });
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'courses'));
            const courses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Compute Stats
            const total = courses.length;
            const free = courses.filter(c => c.isFree).length;
            const paid = courses.filter(c => !c.isFree).length;
            
            // Safe sort
            const sorted = [...courses].sort((a,b) => (b.popularity || 0) - (a.popularity || 0));
            const mostWatched = sorted.length > 0 ? sorted[0].title : 'None';
            
            const totalViews = courses.reduce((acc, curr) => acc + (curr.popularity || 0), 0);

            setStats({ total, free, paid, mostWatched, totalViews });
        } catch (error) {
            console.error("Error fetching stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        setGenerated(true);
    };

    const handleDownload = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text("YaTi Learning - Platform Report", 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        
        doc.line(20, 35, 190, 35); // Horizontal line

        doc.setFontSize(14);
        doc.text("Summary Statistics", 20, 50);
        
        doc.setFontSize(12);
        doc.text(`Total Courses: ${stats.total}`, 30, 60);
        doc.text(`Free Courses: ${stats.free}`, 30, 70);
        doc.text(`Paid Courses: ${stats.paid}`, 30, 80);
        doc.text(`Total Lesson Views: ${stats.totalViews}`, 30, 90);
        doc.text(`Most Watched Course: ${stats.mostWatched}`, 30, 100);

        doc.save("yati_admin_report.pdf");
    };

    return (
        <div>
            <h1 className="mb-4">Reports</h1>
            
            {loading ? <p>Loading stats...</p> : (
                <div style={{ marginTop: '20px', background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>Platform Summary</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Courses</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.total}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Content Ratio</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.free} Free / {stats.paid} Paid</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Views</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalViews}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>Most Popular</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.mostWatched}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px' }}>
                        {!generated ? (
                            <button className="btn btn-primary" onClick={handleGenerate}>
                                Generate PDF Report
                            </button>
                        ) : (
                            <button className="btn btn-success" onClick={handleDownload} style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}>
                                Download PDF
                            </button>
                        )}
                        
                        {generated && (
                             <button className="btn btn-secondary" onClick={() => setGenerated(false)}>
                                Reset
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
