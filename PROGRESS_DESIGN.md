# 📈 Progress Tracking Logic Implementation

This document details the logic for handling dynamic progress tracking in YaTi, ensuring robustness when content changes.

## 核心 Core Philosophy: Decoupled State
To satisfy the requirement "Admins can add lessons later without breaking progress," we decouple the **User's State** (Numerator) from the **Course's State** (Denominator).

- **Numerator**: `users/{uid}/progress/{courseId}.completedLessonIds.length`
- **Denominator**: `courses/{courseId}.totalLessons`

## 1. Firestore Data Interactions

### A. Marking a Lesson as Complete
When a user finishes a video:

**Function**: `markLessonComplete(userId, courseId, lessonId)`

```javascript
// Reference to the specific course progress document
const progressRef = doc(db, 'users', userId, 'progress', courseId);

await setDoc(progressRef, {
    courseId: courseId,
    // atomic union ensures no duplicates if clicked twice
    completedLessonIds: arrayUnion(lessonId), 
    lastUpdated: serverTimestamp()
}, { merge: true });

// Trigger global progress update (see Section 2)
await updateGlobalProgress(userId);
```

### B. Calculating Course Progress (Read-Time)
This happens on the client side (Dashboard/Course Page) to ensure it is always up-to-date with course changes.

**Formula**:
```javascript
const completedCount = progressDoc.data().completedLessonIds.length;
const totalLessons = courseDoc.data().totalLessons; // Fetched from Course Metadata

// Handle Divide by Zero Edge Case
const percentage = totalLessons > 0 
    ? Math.round((completedCount / totalLessons) * 100) 
    : 0;
```

---

## 2. Dynamic Overall Progress & Admin Updates

The requirement "Overall progress updates dynamically" can be interpreted in two ways. Since we initialize it at 1%, we likely want a stored "Engagement Score" or "Average Completion".

### Strategy: Aggregated Update
When `markLessonComplete` runs, we recalculate the global 'overallProgress'.

**Function**: `updateGlobalProgress(userId)`

```javascript
// 1. Fetch all course progress documents for the user
const progressColl = collection(db, 'users', userId, 'progress');
const snapshot = await getDocs(progressColl);

// 2. Fetch all related courses to get their current 'totalLessons'
// Optimziation: In a real app, we might cache 'totalLessons' or store a snapshot, 
// but for true dynamic accuracy, we check the latest course metadata.
let totalPercentageSum = 0;
let startedCoursesCount = 0;

// This loop would realistically fetch course data or use cached data
for (const doc of snapshot.docs) {
     const pData = doc.data();
     const courseId = pData.courseId;
     // Retrieve 'totalLessons' from your courses cache/state
     const courseTotal = getCourseTotal(courseId); 
     
     if (courseTotal > 0) {
         const p = (pData.completedLessonIds.length / courseTotal) * 100;
         totalPercentageSum += Math.min(p, 100); // Cap at 100
     }
     startedCoursesCount++;
}

// 3. Calculate Average
const newOverall = startedCoursesCount > 0 
    ? Math.round(totalPercentageSum / startedCoursesCount) 
    : 1; // Default back to 1% if nothing else

// 4. Update User Profile
await updateDoc(doc(db, 'users', userId), {
    overallProgress: newOverall
});
```

### Handling Admin Updates (The "Dynamic" Rule)
*   **Scenario**: Admin adds 5 lessons to "React 101".
*   **Immediate Effect**: `courses/react101.totalLessons` increases.
*   **Next User Visit**:
    *   Course Progress (`completed / new_total`) **Drops** automatically. Correct ✅.
    *   Overall Progress: Will update next time `updateGlobalProgress` is called, OR we wait for next user interaction. This is "Lazy Consistency" which is scalable.

---

## 3. Edge Case Handling

| Scenario | Handling Strategy |
|:---|:---|
| **Admin deletes a lesson** | `completedLessonIds` might contain the deleted ID. This is harmless logic-wise (count is just count). *Optional Cleanup*: Run a cloud function to remove invalid IDs periodically. |
| **Admin deletes a course** | The `progress` sub-document remains (orphaned). Logic should handle missing course metadata gracefully (return 0% or hide). |
| **New User (No Progress)** | `overallProgress` is manually set to 1% on creation (Auth Rule). |
| **Total Lessons = 0** | Prevent `NaN`. Function returns 0%. |
| **Completed > Total** | If admin *removes* lessons, user might have 6/5 completed. Logic caps percentage at `Math.min(calc, 100)`. |

---

## 4. Hooks Design (React)

Recommend implementing these custom hooks:

1.  `useCourseProgress(userId, courseId)`
    *   Subscribes to `users/{uid}/progress/{courseId}`.
    *   Subscribes to `courses/{courseId}`.
    *   Returns `{ percent, completedIds, isCompleted }`.
2.  `useOverallProgress(userId)`
    *   Subscribes to `users/{userId}`.
    *   Returns `user.overallProgress`.
