import { arrayUnion, collection, doc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Service to handle user progress tracking
 * Follows strict design: users/{uid}/progress/{courseId}
 */

const ProgressService = {
    /**
     * Mark a lesson (video) as completed
     * @param {string} userId 
     * @param {string} courseId 
     * @param {string} lessonId 
     */
    markLessonComplete: async (userId, courseId, lessonId) => {
        try {
            // Reference to the specific course progress document in sub-collection
            const progressRef = doc(db, 'users', userId, 'progress', courseId);

            // Atomic update to add lessonId to array
            await setDoc(progressRef, {
                courseId: courseId,
                completedLessonIds: arrayUnion(lessonId),
                lastUpdated: serverTimestamp()
            }, { merge: true });

            // Analytics: Increment global popularity counter on the Course Document
            if (courseId && courseId !== 'general') {
                const courseRef = doc(db, 'courses', courseId);
                // We use updateDoc safely; if course doesn't exist, this might fail, hence the try/catch block is good.
                // We use 'increment(1)' to avoid race conditions.
                await updateDoc(courseRef, {
                    popularity: increment(1)
                });
            }

            return true;
        } catch (error) {
            console.error("Error marking lesson complete:", error);
            throw error;
        }
    },

    /**
     * Subscribe to a specific course's progress
     * @param {string} userId 
     * @param {string} courseId 
     * @param {function} callback 
     * @returns {function} Unsubscribe
     */
    subscribeToCourseProgress: (userId, courseId, callback) => {
        const progressRef = doc(db, 'users', userId, 'progress', courseId);
        return onSnapshot(progressRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                callback({ completedLessonIds: [] });
            }
        });
    },

    /**
     * Subscribe to ALL progress (Adapter for Dashboard)
     * Maps the new sub-collection structure back to a flat list of all completed videos
     * to maintain compatibility with the current Dashboard view.
     */
    subscribeToAllProgress: (userId, callback) => {
        const progressColl = collection(db, 'users', userId, 'progress');
        return onSnapshot(progressColl, (snapshot) => {
            let allCompleted = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.completedLessonIds) {
                    allCompleted = [...allCompleted, ...data.completedLessonIds];
                }
            });

            // Return aggregated format expected by Dashboard
            callback({ completedVideos: allCompleted });
        });
    },

    /**
     * Calculate percentage
     */
    calculatePercentage: (completedCount, totalCount) => {
        if (!totalCount || totalCount === 0) return 0;
        // Cap at 100% just in case of data anomalies
        return Math.min(Math.round((completedCount / totalCount) * 100), 100);
    }
};

export default ProgressService;
