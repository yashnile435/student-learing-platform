# 🔥 YaTi Firestore Database Schema Design

This schema is designed for scalability, security, and real-time progress tracking. It transitions from a flat `videos` list to a structured Course -> Lesson hierarchy.

## 1. 👥 Users Collection
**Path:** `users/{userId}`

Stores user profile and global stats.

| Field Name | Type | Description |
|:---|:---|:---|
| `uid` | string | Auth UID (Document ID). |
| `email` | string | User email. |
| `displayName` | string | Full name. |
| `role` | string | `'student'` or `'admin'`. |
| `overallProgress`| number | **Default: 1**. Global engagement score (gamification). |
| `plans` | array | `['free']`, `['premium']` etc. |
| `createdAt` | timestamp| Account creation time. |

> **Requirement Check:** "New users start with overallProgress = 1%" is handled here by initializing this field to `1` on signup.

---

## 2. 📚 Courses Collection
**Path:** `courses/{courseId}`

Top-level metadata for courses.

| Field Name | Type | Description |
|:---|:---|:---|
| `title` | string | Course title. |
| `description` | string | Brief summary. |
| `thumbnailUrl` | string | Cover image. |
| `isFree` | boolean | If true, open to everyone. |
| `price` | number | Cost in USD (if not free). |
| `tutorId` | string | UID of the instructor. |
| `totalLessons` | number | **Crucial for progress calc**. Updated by Cloud Function or Admin when lessons change. |
| `published` | boolean | Visibility toggle. |

---

## 3. 🎥 Lessons Sub-collection
**Path:** `courses/{courseId}/lessons/{lessonId}`

Actual content lives here. Using a sub-collection allows fetching course details *without* downloading 50+ lesson objects, saving bandwidth.

| Field Name | Type | Description |
|:---|:---|:---|
| `title` | string | Lesson title. |
| `videoUrl` | string | YouTube/Vimeo ID or URL. |
| `duration` | number | Length in minutes. |
| `sequence` | number | Order (1, 2, 3...) for sorting. |
| `resources` | array | Links to PDF/Notes `{ title, url }`. |
| `isFreePreview`| boolean | Allow watching this without purchase? |

---

## 4. 📈 User Progress (Sub-collection)
**Path:** `users/{userId}/progress/{courseId}`

Tracks progress **per course**. We use a sub-collection under the user to prevent the main user document from hitting the 1MB limit.

| Field Name | Type | Description |
|:---|:---|:---|
| `courseId` | string | Reference to the course (Document ID). |
| `completedLessonIds`| array | List of completed lesson IDs: `['lesson_A', 'lesson_B']`. |
| `lastWrappedUp` | timestamp| Last time they studied. |
| `isCompleted` | boolean | True if 100% complete. |

### 🧠 Dynamic Logic (The "Magic")
To calculate progress dynamically (handling new lessons):

1. **Client Read:** Fetch `users/{uid}/progress/{courseId}` -> Get `completedLessonIds.length` (e.g., 5).
2. **Course Read:** Fetch `courses/{courseId}` -> Get `totalLessons` (e.g., 10).
3. **Calculation:** `(5 / 10) * 100 = 50%`.

**Scenario: Admin adds 10 new lessons.**
- `courses/{courseId}.totalLessons` updates to 20.
- User visits dashboard.
- Calculation: `(5 / 20) * 100 = 25%`.
- **Result:** Progress updates instantly and correctly without rewriting user documents.

---

## 5. 💰 Purchases / Enrollments
**Path:** `enrollments/{enrollmentId}`

Records access rights.

| Field Name | Type | Description |
|:---|:---|:---|
| `userId` | string | Buyer UID. |
| `courseId` | string | Course purchased. |
| `amount` | number | Price paid. |
| `method` | string | 'stripe', 'paypal', 'manual'. |
| `status` | string | 'active', 'refunded'. |
| `purchasedAt` | timestamp| Date of transaction. |

---

## ⚡ Firestore Rules Strategy

1. **Users:** Users can read/write their own `users/{userId}`.
2. **Courses:** Public read (or authenticated read). Admin write only.
3. **Progress:** Users can read/write their own `users/{userId}/progress/*`.
4. **Enrollments:** Users can read their own. Admin write only (server-side).

## 📊 Summary of Relationships

- **User** 1:M **Enrollments**
- **User** 1:M **Progress**
- **Course** 1:M **Lessons**
- **Course** 1:M **Enrollments**
