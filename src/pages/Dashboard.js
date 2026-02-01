import { collection, onSnapshot, query, where, documentId } from 'firebase/firestore';
import { lazy, Suspense, useEffect, useState } from 'react';
import { FaArrowLeft, FaCheckCircle, FaPlay } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import ProgressService from '../services/progressService';
import '../index.css';

// Lazy load heavy VideoPlayer
const VideoPlayer = lazy(() => import('../components/VideoPlayer'));

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
    const [activeCourseProgress, setActiveCourseProgress] = useState({ completedLessonIds: [] });

    // Fetch Data Logic
    useEffect(() => {
        setLoading(true);
        let unsubscribe = () => { };

        const fetchData = async () => {
            try {
                if (activeCourseId) {
                    // 1. View: Specific Course Lessons
                    const lessonsRef = collection(db, 'courses', activeCourseId, 'lessons');
                    // Simple lesson fetch
                    unsubscribe = onSnapshot(lessonsRef, (snap) => {
                        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                        // Sort by index/created if possible. For now just list.
                        list.sort((a, b) => (a.order || 0) - (b.order || 0));
                        setLessons(list);
                    });

                    // Subscribe to progress
                    if (user) {
                        ProgressService.subscribeToCourseProgress(user.uid, activeCourseId, (data) => {
                            setActiveCourseProgress(data);
                        });
                    }

                } else {
                    // 2. View: My Learning (Enrolled Courses Only)
                    const enrolledCourseIds = userData?.purchasedCourses || [];

                    if (enrolledCourseIds.length > 0) {
                        // Limit to 10 for safety in this query type
                        const safeIds = enrolledCourseIds.slice(0, 10);
                        const q = query(collection(db, 'courses'), where(documentId(), 'in', safeIds));
                        unsubscribe = onSnapshot(q, (snap) => {
                            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                            setCourses(list);
                        });
                    } else {
                        setCourses([]);
                    }
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
        return () => unsubscribe();
    }, [activeCourseId, user, userData]);

    const handleBackToCourses = () => {
        setActiveCourseId(null);
        setLessons([]);
        navigate('/dashboard', { state: null });
    };

    if (loading) return <div className="p-4">Loading...</div>;

    // View: Active Course (Player Mode)
    if (activeCourseId) {
        return (
            <div>
                <button
                    onClick={handleBackToCourses}
                    className="btn btn-secondary mb-4"
                    style={{ gap: '0.5rem', border: 'none', paddingLeft: 0, justifyContent: 'flex-start' }}
                >
                    <FaArrowLeft /> Back to My Learning
                </button>

                <h1 className="mb-4">{lessons.length > 0 ? 'Course Content' : 'No Lessons Found'}</h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {lessons.map(lesson => {
                        const isCompleted = activeCourseProgress.completedLessonIds?.includes(lesson.id);
                        return (
                            <div
                                key={lesson.id}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    padding: 0,
                                    overflow: 'hidden',
                                    border: isCompleted ? '2px solid var(--success-color)' : '1px solid var(--border-color)'
                                }}
                                onClick={() => setSelectedVideo(lesson)}
                            >
                                <div style={{ position: 'relative', height: '160px', background: '#000' }}>
                                    <img
                                        src={`https://img.youtube.com/vi/${lesson.videoId}/hqdefault.jpg`}
                                        alt={lesson.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                    />
                                    <div className="flex-center" style={{ position: 'absolute', inset: 0, color: 'white', fontSize: '2rem' }}>
                                        <FaPlay />
                                    </div>
                                    {isCompleted && (
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--success-color)', background: 'white', borderRadius: '50%', padding: '2px' }}>
                                            <FaCheckCircle size={20} />
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{lesson.title}</h3>
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>{lesson.duration} mins</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {selectedVideo && (
                    <Suspense fallback={<div>Loading Player...</div>}>
                        <VideoPlayer
                            video={selectedVideo}
                            courseId={activeCourseId}
                            onClose={() => setSelectedVideo(null)}
                        />
                    </Suspense>
                )}
            </div>
        );
    }

    // View: Course List (My Learning)
    return (
        <div>
            <h1 className="mb-4">My Learning</h1>

            {courses.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Start your journey today!</h3>
                    <p>You are not enrolled in any courses yet.</p>
                    <button className="btn btn-primary mt-4" onClick={() => navigate('/courses')}>
                        Explore Courses
                    </button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ height: '180px', overflow: 'hidden' }}>
                                <img
                                    src={course.thumbnail || 'https://via.placeholder.com/300x200?text=Course'}
                                    alt={course.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100% - 180px)' }}>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                                <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{course.description ? course.description.substring(0, 80) + '...' : ''}</p>
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => setActiveCourseId(course.id)}
                                >
                                    Continue Learning
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
