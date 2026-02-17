const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const dirs = [
    'src/pages/admin',
    'src/pages/teacher',
    'src/pages/student',
    'src/components/admin',
    'src/components/teacher',
    'src/components/student',
    'src/components/common'
];

dirs.forEach(d => {
    const fullPath = path.join(__dirname, d);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('Created:', d);
    }
});

const moves = [
    // Student
    { src: 'src/pages/Dashboard.js', dest: 'src/pages/student/Dashboard.js' },
    { src: 'src/pages/Courses.js', dest: 'src/pages/student/Courses.js' },

    // Teacher
    { src: 'src/pages/admin/AddLesson.js', dest: 'src/pages/teacher/AddLesson.js' },
    { src: 'src/pages/admin/DeleteLessons.js', dest: 'src/pages/teacher/DeleteLessons.js' },
    { src: 'src/pages/admin/EditCourse.js', dest: 'src/pages/teacher/EditCourse.js' },

    // Common Components
    { src: 'src/components/VideoPlayer.js', dest: 'src/components/common/VideoPlayer.js' },
    { src: 'src/components/Loading.js', dest: 'src/components/common/Loading.js' },
    { src: 'src/components/PrivateRoute.js', dest: 'src/components/common/PrivateRoute.js' },
    { src: 'src/components/PublicRoute.js', dest: 'src/components/common/PublicRoute.js' },
    { src: 'src/components/PasswordInput.js', dest: 'src/components/common/PasswordInput.js' },
];

moves.forEach(move => {
    const srcPath = path.join(__dirname, move.src);
    const destPath = path.join(__dirname, move.dest);

    if (fs.existsSync(srcPath)) {
        let content = fs.readFileSync(srcPath, 'utf8');

        // UPDATE IMPORTS IN CONTENT BEFORE WRITING

        // Fix relative paths for files moving deeper (pages/ -> pages/student/)
        // or changing parent (pages/admin/ -> pages/teacher/) - level stays same for teacher moves, but context might change?
        // pages/admin (depth 2 from src) -> pages/teacher (depth 2 from src). Same depth.
        // pages/ (depth 1 from src) -> pages/student/ (depth 2 from src). Depth increases by 1.

        // Case 1: Increasing depth (pages/Dashboard.js -> pages/student/Dashboard.js)
        if (move.src.startsWith('src/pages/') && !move.src.startsWith('src/pages/admin') && move.dest.includes('pages/student')) {
            // Add one level to relative imports that go up
            content = content.replace(/from\s+['"]\.\.\//g, "from '../../");
            // Special case: imports from sibling pages? e.g. './Login'
            // If Dashboard imports './Login', Login is still at src/pages/Login.js
            // So from src/pages/student/Dashboard.js, it should be '../Login'.
            content = content.replace(/from\s+['"]\.\/([^/]+)['"]/g, "from '../$1'");
        }

        // Case 2: Moving from admin to teacher (src/pages/admin/AddLesson.js -> src/pages/teacher/AddLesson.js)
        // Depth is same (pages/admin vs pages/teacher). Relative imports like '../components' stay same (../../components).
        // Imports from './SomeAdminPage' might break if that page stayed in admin.
        // Checking internal imports.

        // Update references to moved components (VideoPlayer etc)
        // Old: '../components/VideoPlayer' (from pages/Dashboard)
        // New: '../../components/common/VideoPlayer' (from pages/student/Dashboard)
        // Start with replacing the component path part
        content = content.replace(/components\/VideoPlayer/g, "components/common/VideoPlayer");
        content = content.replace(/components\/Loading/g, "components/common/Loading");
        content = content.replace(/components\/PrivateRoute/g, "components/common/PrivateRoute");
        content = content.replace(/components\/PublicRoute/g, "components/common/PublicRoute");
        content = content.replace(/components\/PasswordInput/g, "components/common/PasswordInput");

        // Now write to dest
        fs.writeFileSync(destPath, content);
        fs.unlinkSync(srcPath); // Delete source
        console.log(`Moved & Updated: ${move.src} -> ${move.dest}`);
    } else {
        // Check if already moved?
        if (fs.existsSync(destPath)) {
            console.log(`Already moved: ${move.dest}`);
        } else {
            console.log(`Source missing: ${move.src}`);
        }
    }
});

// Update App.js
const appPath = path.join(__dirname, 'src/App.js');
if (fs.existsSync(appPath)) {
    let appContent = fs.readFileSync(appPath, 'utf8');

    // Update import paths
    appContent = appContent.replace(/import\('\.\/pages\/Dashboard'\)/g, "import('./pages/student/Dashboard')");
    appContent = appContent.replace(/import\('\.\/pages\/Courses'\)/g, "import('./pages/student/Courses')");
    appContent = appContent.replace(/import\('\.\/pages\/admin\/AddLesson'\)/g, "import('./pages/teacher/AddLesson')");
    appContent = appContent.replace(/import\('\.\/pages\/admin\/DeleteLessons'\)/g, "import('./pages/teacher/DeleteLessons')");
    appContent = appContent.replace(/import\('\.\/pages\/admin\/EditCourse'\)/g, "import('./pages/teacher/EditCourse')");

    // Update component imports in App.js
    appContent = appContent.replace(/['"]\.\/components\/(PrivateRoute|PublicRoute|Loading)['"]/g, "'./components/common/$1'");


    fs.writeFileSync(appPath, appContent);
    console.log('Updated App.js');
}

// Update Layouts if needed
const layouts = ['src/layouts/DashboardLayout.js', 'src/layouts/PublicLayout.js'];
layouts.forEach(l => {
    const lPath = path.join(__dirname, l);
    if (fs.existsSync(lPath)) {
        let lContent = fs.readFileSync(lPath, 'utf8');
        // Layouts are in src/layouts. Components are in src/components.
        // Import is likely '../components/...'
        // Need to update to '../components/common/...' for moved comps

        lContent = lContent.replace(/['"]\.\.\/components\/(VideoPlayer|Loading|PrivateRoute|PublicRoute|PasswordInput|Navbar|AdminNavbar)['"]/g, "'../components/common/$1'");

        fs.writeFileSync(lPath, lContent);
        console.log(`Updated ${l}`);
    }
});

