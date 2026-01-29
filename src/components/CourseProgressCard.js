
import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaLock, FaPlay } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ProgressService from '../services/progressService';
import ProgressBar from './ProgressBar';
import '../styles/CourseProgressCard.css'; // Will create this

const CourseProgressCard = ({ course, onClick, hideProgress }) => {
    const { user, userData } = useAuth();
    const [progress, setProgress] = useState({ completedLessonIds: [] });
    const [percentage, setPercentage] = useState(0);

    const isPurchased = userData?.purchasedCourses?.includes(course.id);
    const hasAccess = course.isFree || isPurchased || userData?.role === 'admin';

    const [imageError, setImageError] = useState(false);

    // Calculate Progress
    useEffect(() => {
        let unsubscribe = () => {};

        if (user && hasAccess && !hideProgress) {
            // Subscribe only if we need to show progress
            unsubscribe = ProgressService.subscribeToCourseProgress(user.uid, course.id, (data) => {
                setProgress(data);
            });
        } else {
            setProgress({ completedLessonIds: [] });
            setPercentage(0);
        }

        return () => unsubscribe();
    }, [user, course.id, hasAccess, hideProgress]);

    // Update Percentage
    useEffect(() => {
        if (course.totalLessons > 0) {
            const pct = ProgressService.calculatePercentage(
                progress.completedLessonIds?.length || 0,
                course.totalLessons
            );
            setPercentage(pct);
        }
    }, [progress, course.totalLessons]);

    const renderThumbnail = () => {
        // Use i.ytimg.com as it is the direct CDN and often less blocked
        const imgSrc = course.thumbnail || (course.videoId ? `https://i.ytimg.com/vi/${course.videoId}/hqdefault.jpg` : null);
        
        if (imgSrc && !imageError) {
            return (
                <img 
                    src={imgSrc} 
                    alt={course.title} 
                    loading="lazy"
                    onError={(e) => {
                        setImageError(true);
                    }}
                />
            );
        }

        // Fallback Gradient
        return (
            <div className="thumbnail-fallback" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }}>
                {course.title.slice(0, 2)}
            </div>
        );
    };

    return (
        <div className={`course-card ${!hasAccess ? 'locked' : ''}`} onClick={() => onClick(course)}>
            <div className="course-thumbnail">
                {renderThumbnail()}
                
                {/* Overlay States */}
                <div className="card-overlay">
                    {hasAccess ? (
                        percentage >= 100 && !hideProgress ? (
                            <div className="badge-completed"><FaCheckCircle /> Completed</div>
                        ) : (
                            <FaPlay className="icon-play" />
                        )
                    ) : (
                        <FaLock className="icon-lock" />
                    )}
                </div>
            </div>

            <div className="course-details">
                <div className="course-header">
                    <h3>{course.title}</h3>
                    <span className={`badge ${course.isFree ? 'free' : 'premium'}`}>
                        {course.isFree ? 'Free' : 'Premium'}
                    </span>
                </div>
                
                <p className="description">{course.description || "No description available."}</p>
                
                {/* Progress Section: Show only if hasAccess and NOT hiding progress */}
                {user && hasAccess && !hideProgress && (
                    <div className="course-footer">
                        <ProgressBar percentage={percentage} />
                        <div className="lessons-count">
                            {progress.completedLessonIds?.length || 0} / {course.totalLessons} Lessons
                        </div>
                    </div>
                )}

                {/* CTA Button: Show if locked OR if hiding progress (e.g. Explore Page) */}
                {(!hasAccess || hideProgress) && (
                    <div className="course-footer">
                         <button className={`btn-unlock ${hasAccess ? 'btn-accessed' : ''}`} style={hasAccess ? {background: '#4ade80', color: '#064e3b'} : {}}>
                            {hasAccess ? 'Go to Course' : (course.isFree ? 'Enroll Now' : 'Unlock Course')}
                         </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseProgressCard;
