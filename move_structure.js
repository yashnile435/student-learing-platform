const fs = require('fs');
const path = require('path');

const moves = [
    // Pages - Student
    { src: 'src/pages/Dashboard.js', dest: 'src/pages/student/Dashboard.js' },
    { src: 'src/pages/Courses.js', dest: 'src/pages/student/Courses.js' },

    // Pages - Teacher (Moved from Admin as per instructions)
    { src: 'src/pages/admin/AddLesson.js', dest: 'src/pages/teacher/AddLesson.js' },
    { src: 'src/pages/admin/DeleteLessons.js', dest: 'src/pages/teacher/DeleteLessons.js' },
    { src: 'src/pages/admin/EditCourse.js', dest: 'src/pages/teacher/EditCourse.js' },

    // Components - Common
    { src: 'src/components/VideoPlayer.js', dest: 'src/components/common/VideoPlayer.js' },
    { src: 'src/components/Loading.js', dest: 'src/components/common/Loading.js' },
    { src: 'src/components/PrivateRoute.js', dest: 'src/components/common/PrivateRoute.js' },
    { src: 'src/components/PublicRoute.js', dest: 'src/components/common/PublicRoute.js' },
    { src: 'src/components/PasswordInput.js', dest: 'src/components/common/PasswordInput.js' },
];

moves.forEach(move => {
    if (fs.existsSync(move.src)) {
        fs.renameSync(move.src, move.dest);
        console.log(`Moved ${move.src} to ${move.dest}`);
    } else {
        console.log(`Source not found: ${move.src}`);
    }
});
