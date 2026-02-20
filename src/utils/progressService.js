import { arrayUnion, collection, doc, increment, onSnapshot, serverTimestamp, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Service to handle user progress tracking
 * Follows strict design: users/{uid}/progress/{courseId}
 */

const ProgressService = {
    /**
     * Mark a lesson (video) as completed
     * Recalculates progress percentage automatically if totalLessons is provided
     */
    markLessonComplete: async (userId, courseId, lessonId, totalLessons = 0) => {
        try {
            const progressRef = doc(db, 'users', userId, 'progress', courseId);

            // 1. Get current data to check if already completed (optimization)
            const docSnap = await getDoc(progressRef);
            let currentCompleted = [];
            if (docSnap.exists()) {
                currentCompleted = docSnap.data().completedLessonIds || [];
                if (currentCompleted.includes(lessonId)) return; // Already completed
            }

            const newCompletedCount = currentCompleted.length + 1;

            // 2. Calculate Percentage
            let percentage = 0;
            if (totalLessons > 0) {
                percentage = Math.min(Math.round((newCompletedCount / totalLessons) * 100), 100);
            }

            // 3. Update Firestore
            const updateData = {
                courseId: courseId,
                completedLessonIds: arrayUnion(lessonId),
                lastUpdated: serverTimestamp(),
                progressPercentage: percentage,
                totalLessons: totalLessons // Keep this synced
            };

            await setDoc(progressRef, updateData, { merge: true });

            // 4. Analytics: Increment global popularity counter
            if (courseId && courseId !== 'general') {
                const courseRef = doc(db, 'courses', courseId);
                await updateDoc(courseRef, {
                    popularity: increment(1)
                }).catch(e => console.log("Analytics update skipped", e));
            }

            return true;
        } catch (error) {
            console.error("Error marking lesson complete:", error);
            throw error;
        }
    },

    /**
     * Increment watch count for a specific lesson
     */
    incrementWatchCount: async (userId, courseId, lessonId) => {
        try {
            const progressRef = doc(db, 'users', userId, 'progress', courseId);
            // Use dot notation for nested map update: videoWatchCount.{lessonId}
            const fieldPath = `videoWatchCount.${lessonId}`;

            await setDoc(progressRef, {
                [fieldPath]: increment(1),
                lastPlayed: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error incrementing watch count:", error);
        }
    },

    /**
     * Subscribe to a specific course's progress
     */
    subscribeToCourseProgress: (userId, courseId, callback) => {
        const progressRef = doc(db, 'users', userId, 'progress', courseId);
        return onSnapshot(progressRef, (docSnap) => {
            if (docSnap.exists()) {
                callback(docSnap.data());
            } else {
                callback({ completedLessonIds: [], videoWatchCount: {}, progressPercentage: 0 });
            }
        });
    },

    /**
     * Subscribe to ALL progress docs for a user
     * Returns a map: { [courseId]: progressData }
     */
    subscribeToAllUserProgress: (userId, callback) => {
        const progressColl = collection(db, 'users', userId, 'progress');
        return onSnapshot(progressColl, (snapshot) => {
            const progressMap = {};
            snapshot.forEach(doc => {
                progressMap[doc.id] = doc.data();
            });
            callback(progressMap);
        });
    },

    /**
     * Sync total lessons if changed (Utility)
     */
    syncTotalLessons: async (userId, courseId, totalLessons) => {
        try {
            const progressRef = doc(db, 'users', userId, 'progress', courseId);
            const docSnap = await getDoc(progressRef);
            if (!docSnap.exists()) return;

            const data = docSnap.data();
            const completedCount = data.completedLessonIds?.length || 0;
            const percentage = Math.min(Math.round((completedCount / totalLessons) * 100), 100);

            if (data.totalLessons !== totalLessons || data.progressPercentage !== percentage) {
                await updateDoc(progressRef, {
                    totalLessons: totalLessons,
                    progressPercentage: percentage
                });
            }
        } catch (e) {
            console.error("Sync error", e);
        }
    }
};

export default ProgressService;
