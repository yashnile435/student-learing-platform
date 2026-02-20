import { useEffect, useState, useRef } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import ProgressService from '../../utils/progressService';
import '../../index.css';

const VideoPlayer = ({ video, courseId = 'general', onClose, totalLessons = 0 }) => {
    const { user, userRole } = useAuth();
    const [isCompleted, setIsCompleted] = useState(false);
    const watchTimer = useRef(null);
    const hasIncrementedView = useRef(false);

    // 1. Check completion status on mount
    useEffect(() => {
        if (!user || !video) return;

        const unsubscribe = ProgressService.subscribeToCourseProgress(user.uid, courseId, (data) => {
            if (data.completedLessonIds && data.completedLessonIds.includes(video.id)) {
                setIsCompleted(true);
            }
        });

        return () => unsubscribe();
    }, [user, video, courseId]);

    // 2. Watch Logic (Increment View + Auto Complete)
    useEffect(() => {
        if (!user || !video || userRole === 'student' === false) return; // Only track students? Or everyone? Req says "Student"

        // Increment watch count after 5 seconds to count as a "view"
        const viewTimeout = setTimeout(() => {
            if (!hasIncrementedView.current) {
                ProgressService.incrementWatchCount(user.uid, courseId, video.id);
                hasIncrementedView.current = true;
            }
        }, 5000);

        // Auto Complete Logic
        // Threshold: 70% of duration
        // If duration is 0 or missing, default to 30 seconds
        const durationMins = video.duration || 0.5;
        const thresholdSeconds = (durationMins * 60) * 0.7;
        const validThreshold = Math.max(thresholdSeconds, 10); // Minimum 10 seconds

        console.log(`Tracking video. Completes in ${validThreshold} seconds.`);

        watchTimer.current = setTimeout(async () => {
            if (!isCompleted) {
                await ProgressService.markLessonComplete(user.uid, courseId, video.id, totalLessons);
                setIsCompleted(true);
            }
        }, validThreshold * 1000);

        return () => {
            clearTimeout(viewTimeout);
            if (watchTimer.current) clearTimeout(watchTimer.current);
        };
    }, [user, video, courseId, totalLessons, isCompleted, userRole]);

    if (!video) return null;

    // If inline mode, render without modal overlay
    if (userRole === 'student' || onClose === undefined) {
        // Force inline for students or if no close handler (implied new layout usage)
        // Or strictly use the passed prop if I add it. 
        // Let's rely on a new prop 'inline' or just check if onClose is null?
        // The user request says "Right: Video player section", implying inline.
    }

    // Actually, I'll just add the prop.
    const isInline = !onClose; // Logic: if no onClose provided, it's inline.

    if (isInline) {
        return (
            <div className="video-player-inline" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div className="iframe-container" style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    ></iframe>
                </div>
                <div className="video-details" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: '#1a1a2e', flex: 1 }}>{video.title}</h2>
                        {isCompleted && (
                            <div style={{
                                background: '#dcfce7', color: '#166534', padding: '0.4rem 1rem',
                                borderRadius: '30px', fontWeight: 600, fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
                            }}>
                                <FaCheckCircle /> Completed
                            </div>
                        )}
                    </div>
                    {video.description && (
                        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Description</h4>
                            <p style={{ color: '#334155', lineHeight: 1.6, margin: 0 }}>{video.description}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="video-modal-overlay" onClick={onClose}>
            <div className="video-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <FaTimes />
                </button>

                <div className="iframe-container">
                    <iframe
                        src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="video-details">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <h2>{video.title}</h2>
                        {isCompleted && (
                            <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <FaCheckCircle /> Completed
                            </div>
                        )}
                    </div>
                    <p>{video.description || 'No description available.'}</p>
                    {video.notesUrl && (
                        <div className="mt-4">
                            <a href={video.notesUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                                Download Notes
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
