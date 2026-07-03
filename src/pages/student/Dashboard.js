
import { collection, onSnapshot, query, where, documentId } from 'firebase/firestore';
import { lazy, Suspense, useEffect, useState } from 'react';
import { FaArrowLeft, FaCheckCircle, FaPlay, FaEye, FaGraduationCap } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import ProgressService from '../../utils/progressService';
import { getUserPayments } from '../../utils/paymentService';
import '../../index.css';

// Lazy load heavy VideoPlayer
const VideoPlayer = lazy(() => import('../../components/common/VideoPlayer'));

const Dashboard = () => {
    const { user, userData } = useAuth();
    const { state } = useLocation();
    const navigate = useNavigate();

    // State
    const [activeCourseId, setActiveCourseId] = useState(state?.courseId || null);
    const [courses, setCourses] = useState([]); // Enrolled courses
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);

    // Progress State
    const [activeCourseProgress, setActiveCourseProgress] = useState({ completedLessonIds: [], videoWatchCount: {}, progressPercentage: 0 });
    const [allCoursesProgress, setAllCoursesProgress] = useState({}); // Map: courseId -> progressData

    const [paymentHistory, setPaymentHistory] = useState([]);
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Fetch Data Logic
    useEffect(() => {
        setLoading(true);
        let unsubscribeLessons = () => { };
        let unsubscribeProgress = () => { };
        let unsubscribeAllProgress = () => { };

        if (!user) return;

        // 1. Always Subscribe to ALL Progress for Dashboard Overview
        unsubscribeAllProgress = ProgressService.subscribeToAllUserProgress(user.uid, (data) => {
            setAllCoursesProgress(data);
        });

        const fetchData = async () => {
            try {
                if (activeCourseId) {
                    // --- ACTIVE COURSE VIEW ---
                    const lessonsRef = collection(db, 'courses', activeCourseId, 'lessons');
                    unsubscribeLessons = onSnapshot(lessonsRef, (snap) => {
                        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        list.sort((a, b) => (a.order || 0) - (b.order || 0));
                        setLessons(list);

                        // Sync Total Lessons count to progress doc if mismatched
                        if (list.length > 0) {
                            ProgressService.syncTotalLessons(user.uid, activeCourseId, list.length);
                        }
                    });

                    // Subscribe to valid single course progress
                    unsubscribeProgress = ProgressService.subscribeToCourseProgress(user.uid, activeCourseId, (data) => {
                        setActiveCourseProgress(data);
                    });

                } else {
                    // --- DASHBOARD VIEW ---
                    const enrolledCourseIds = userData?.purchasedCourses || [];

                    if (enrolledCourseIds.length > 0) {
                        const safeIds = enrolledCourseIds.slice(0, 10);
                        const q = query(collection(db, 'courses'), where(documentId(), 'in', safeIds));

                        // Just fetch once or subscribe? Subscribe is safer for updates
                        // reuse unsubscribeLessons variable for course sub
                        unsubscribeLessons = onSnapshot(q, (snap) => {
                            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                            setCourses(list);
                        });
                    } else {
                        setCourses([]);
                    }
                }

                // Payment History
                if (!paymentHistory.length) {
                    setPaymentLoading(true);
                    getUserPayments(user.uid)
                        .then(setPaymentHistory)
                        .catch(err => console.error(err))
                        .finally(() => setPaymentLoading(false));
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userData) {
            fetchData();
        }

        return () => {
            unsubscribeLessons();
            unsubscribeProgress();
            unsubscribeAllProgress();
        };
    }, [activeCourseId, user, userData]); // Removed paymentHistory dependency to avoid loops

    const handleBackToCourses = () => {
        setActiveCourseId(null);
        setLessons([]);
        navigate('/dashboard', { state: null });
    };

    if (loading) return <div className="p-4">Loading…</div>;

    // --- VIEW: LESSON LIST (Active Course) ---
    if (activeCourseId) {
        // Calculate dynamic progress
        const totalLessonsCount = lessons.length;
        const completedCount = activeCourseProgress.completedLessonIds?.length || 0;
        const remainingCount = Math.max(0, totalLessonsCount - completedCount);
        const progressPercent = totalLessonsCount ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

        // Auto-select first lesson if none selected
        if (!selectedVideo && lessons.length > 0) {
            setSelectedVideo(lessons[0]);
        }

        const currentLesson = selectedVideo || lessons[0];

        return (
            <div className="course-dashboard-container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
                <style>{`
                    .course-split-layout {
                        display: flex;
                        gap: 2rem;
                        height: calc(100vh - 100px); /* Fill remaining height */
                        min-height: 600px;
                    }
                    .lesson-sidebar {
                        width: 350px;
                        flex-shrink: 0;
                        display: flex;
                        flex-direction: column;
                        background: white;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                        overflow: hidden;
                        border: 1px solid #eef2ff;
                    }
                    .video-main-area {
                        flex: 1;
                        overflow-y: auto;
                        min-width: 0; /* Flexbox fix */
                    }
                    .lesson-list-scroll {
                        overflow-y: auto;
                        flex: 1;
                        padding: 1rem;
                    }
                    .lesson-item {
                        display: flex;
                        gap: 1rem;
                        padding: 1rem;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        border: 1px solid transparent;
                        margin-bottom: 0.5rem;
                        align-items: center;
                    }
                    .lesson-item:hover {
                        background: #f5f3ff;
                    }
                    .lesson-item.active {
                        background: #eef2ff;
                        border-color: #c7d2fe;
                    }
                    .lesson-item.completed .lesson-number {
                        background: #22c55e;
                        color: white;
                    }
                    .lesson-number {
                        width: 28px;
                        height: 28px;
                        border-radius: 50%;
                        background: #e2e8f0;
                        color: #64748b;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.8rem;
                        font-weight: 600;
                        flex-shrink: 0;
                    }
                    
                    @media (max-width: 1024px) {
                        .course-split-layout {
                            flex-direction: column;
                            height: auto;
                        }
                        .lesson-sidebar {
                            width: 100%;
                            height: 400px; /* Fixed height list on mobile/tablet */
                            order: 2; /* Video on top */
                        }
                        .video-main-area {
                            width: 100%;
                            order: 1;
                        }
                    }
                `}</style>

                {/* Header Section */}
                <div style={{ marginBottom: '2rem' }}>
                    <button
                        type="button"
                        onClick={handleBackToCourses}
                        className="btn"
                        style={{
                            background: 'transparent', color: '#64748b', padding: 0,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            fontSize: '0.9rem', marginBottom: '1rem', border: 'none'
                        }}
                    >
                        <FaArrowLeft /> Back to My Learning
                    </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                                {courses.find(c => c.id === activeCourseId)?.title || 'Course Content'}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                <span>{completedCount} of {totalLessonsCount} lessons completed</span>
                                <span style={{ width: '4px', height: '4px', background: '#cbd5e1', borderRadius: '50%' }}></span>
                                <span>{progressPercent}% Progress</span>
                            </div>
                        </div>
                        <div style={{ width: '100%', maxWidth: '300px' }}>
                            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
                                    transition: 'width 0.5s ease-out'
                                }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="course-split-layout">
                    {/* LEFT PANEL: LESSON LIST */}
                    <div className="lesson-sidebar">
                        <div style={{ padding: '1.25rem', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#334155' }}>Course Content</h3>
                        </div>
                        <div className="lesson-list-scroll customized-scrollbar">
                            {lessons.map((lesson, index) => {
                                const isCompleted = activeCourseProgress.completedLessonIds?.includes(lesson.id);
                                const isActive = currentLesson?.id === lesson.id;
                                const watchCount = activeCourseProgress.videoWatchCount?.[lesson.id] || 0;

                                return (
                                    <div
                                        key={lesson.id}
                                        className={`lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                        onClick={() => setSelectedVideo(lesson)}
                                    >
                                        <div className="lesson-number">
                                            {isCompleted ? <FaCheckCircle /> : index + 1}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: isActive ? '#4f46e5' : '#334155', marginBottom: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                {lesson.title}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span><FaPlay size={10} style={{ marginRight: '4px' }} /> {lesson.duration}m</span>
                                                {watchCount > 0 && (
                                                    <span><FaEye size={10} style={{ marginRight: '4px' }} /> {watchCount}</span>
                                                )}
                                            </div>
                                        </div>
                                        {isActive && <div style={{ width: '4px', height: '24px', background: '#6366f1', borderRadius: '2px' }}></div>}
                                    </div>
                                );
                            })}
                            {lessons.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No lessons available yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: PLAYER */}
                    <div className="video-main-area">
                        {currentLesson ? (
                            <Suspense fallback={<div className="p-8 text-center">Loading Player…</div>}>
                                <VideoPlayer
                                    video={currentLesson}
                                    courseId={activeCourseId}
                                    totalLessons={totalLessonsCount}
                                // No onClose handler passed -> triggers inline mode
                                />
                            </Suspense>
                        ) : (
                            <div style={{
                                height: '400px',
                                background: '#f8fafc',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94a3b8',
                                border: '2px dashed #cbd5e1'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    <FaPlay size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                    <p>Select a lesson to start watching</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: DASHBOARD (Course List) ---
    const enrolledCount = courses.length;
    const completedCoursesCount = courses.filter(c => {
        const p = allCoursesProgress[c.id];
        return p && p.completedLessonIds?.length === (c.totalLessons || 0) && (c.totalLessons > 0);
    }).length;
    const inProgressCount = enrolledCount - completedCoursesCount;

    return (
        <div style={{ maxWidth: '1600px', margin: '0 auto', paddingBottom: '4rem' }}>
            <style>{`
                .dashboard-header {
                    background: white;
                    border-radius: 20px;
                    padding: 2.5rem;
                    margin-bottom: 2.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    position: relative;
                    overflow: hidden;
                }
                .dashboard-header::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 6px;
                    background: linear-gradient(90deg, #6366f1, #a855f7);
                }
                .stat-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 16px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    border: 1px solid #f1f5f9;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    transition: transform 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
                }
                .stat-icon {
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    display: flex; alignItems: center; justifyContent: center;
                    font-size: 1.75rem;
                }
                .course-card-modern {
                    background: white;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    transition: all 0.3s ease;
                    border: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                }
                .course-card-modern:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                }
                .btn-continue {
                    background: #f8fafc;
                    color: #475569;
                    font-weight: 600;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                .course-card-modern:hover .btn-continue {
                    background: #6366f1;
                    color: white;
                    border-color: #6366f1;
                }
            `}</style>

            {/* 1. Welcome Header */}
            <div className="dashboard-header">
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                        Welcome back, <span style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userData?.name?.split(' ')[0] || 'Student'}</span>! 👋
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', maxWidth: '600px' }}>
                        You've learned a lot this week. Pick up where you left off or start a new course today.
                    </p>
                </div>
                {/* Decorative blob */}
                <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '300px', height: '300px', background: 'linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%)', borderRadius: '50%', opacity: 0.5, filter: 'blur(60px)', zIndex: 0 }}></div>
            </div>

            {/* 2. Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><FaPlay /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{enrolledCount}</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Enrolled Courses</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><FaEye /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{inProgressCount}</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>In Progress</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}><FaGraduationCap /></div>
                    <div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', lineHeight: 1 }}>{completedCoursesCount}</div>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Completed</div>
                    </div>
                </div>
            </div>

            {/* 3. My Courses Grid */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>My Courses</h2>
                <button
                    type="button"
                    onClick={() => navigate('/courses')}
                    style={{ background: 'transparent', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    Browse All <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                </button>
            </div>

            {courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Start your learning journey</h3>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>You assume full control of your future. Start learning today!</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')} style={{ padding: '0.75rem 2rem', borderRadius: '30px' }}>
                        Explore Courses
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                    {courses.map(course => {
                        const progress = allCoursesProgress[course.id] || { completedLessonIds: [], totalLessons: course.totalLessons || 0 };
                        const completedLen = progress.completedLessonIds?.length || 0;
                        const totalLen = course.totalLessons || progress.totalLessons || 1;
                        const percent = Math.min(Math.round((completedLen / totalLen) * 100), 100);

                        return (
                            <div key={course.id} className="course-card-modern">
                                <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                                    <img
                                        src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Course'}
                                        alt={course.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7) 100%)' }}></div>
                                    <div style={{ position: 'absolute', bottom: '1rem', left: '1.25rem', color: 'white' }}>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                                            {completedLen} / {totalLen} Lessons
                                        </div>
                                    </div>
                                    {/* Circular Progress (Optional) or Badge */}
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.9)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {percent}%
                                    </div>
                                </div>
                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.4 }}>{course.title}</h3>
                                    <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: percent === 100 ? '#22c55e' : '#6366f1', borderRadius: '3px', transition: 'width 1s ease-out' }}></div>
                                    </div>
                                    <div style={{ marginTop: 'auto' }}>
                                        <button
                                            type="button"
                                            className="btn btn-continue"
                                            onClick={() => setActiveCourseId(course.id)}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            {percent > 0 ? 'Continue Learning' : 'Start Course'} <FaArrowLeft style={{ transform: 'rotate(180deg)' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* 4. Simple Payment History */}
            {paymentHistory.length > 0 && (
                <div style={{ marginTop: '5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem' }}>Transaction History</h3>
                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <th style={{ padding: '1rem 1.5rem' }}>Course</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Date</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Amount</th>
                                    <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentHistory.map(payment => (
                                    <tr key={payment.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#334155' }}>{payment.courseName}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
                                            {payment.timestamp ? new Date(payment.timestamp.seconds * 1000).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#1e293b' }}>₹{payment.amount}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                                background: payment.status === 'approved' ? '#dcfce7' : '#fee2e2',
                                                color: payment.status === 'approved' ? '#166534' : '#991b1b'
                                            }}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
