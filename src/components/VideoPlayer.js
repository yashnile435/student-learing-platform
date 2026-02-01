
import { useEffect, useState } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ProgressService from '../services/progressService';
import '../styles/VideoPlayer.css';

const VideoPlayer = ({ video, courseId = 'general', onClose }) => {
    const { user, userRole } = useAuth();
    const [markingComplete, setMarkingComplete] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // check completion status on mount if not passed
    useEffect(() => {
        if (!user || !video) return;

        // We can check local specific status if needed, 
        // or rely on the parent validating it.
        // For accurate button state, let's subscribe or check once.
        const unsubscribe = ProgressService.subscribeToCourseProgress(user.uid, courseId, (data) => {
            if (data.completedLessonIds && data.completedLessonIds.includes(video.id)) {
                setIsCompleted(true);
            }
        });
        return () => unsubscribe();
    }, [user, video, courseId]);

    if (!video) return null;

    const handleComplete = async () => {
        if (!user) return;
        if (userRole === 'student') return; // Double protection

        setMarkingComplete(true);
        try {
            await ProgressService.markLessonComplete(user.uid, courseId, video.id);
            setIsCompleted(true); // Optimistic update
        } catch (error) {
            console.error("Failed to mark complete", error);
        } finally {
            setMarkingComplete(false);
        }
    };

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
                        {user && userRole !== 'student' && (
                            <button
                                className={`btn ${isCompleted ? 'btn-success' : 'btn-secondary'}`}
                                onClick={handleComplete}
                                disabled={markingComplete || isCompleted}
                                style={{ marginLeft: '1rem', minWidth: '160px' }}
                            >
                                {isCompleted ? (
                                    <><FaCheckCircle /> Completed</>
                                ) : (
                                    markingComplete ? 'Saving...' : 'Mark Complete'
                                )}
                            </button>
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
