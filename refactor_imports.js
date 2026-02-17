const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                filelist = walkSync(dirFile, filelist);
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                filelist.push(dirFile);
            }
        }
    });
    return filelist;
}

const files = walkSync(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Update component imports (moved to common)
    content = content.replace(/(['"])(\.\.\/)*components\/(VideoPlayer|Loading|PrivateRoute|PublicRoute|PasswordInput)(['"])/g, '$1$2components/common/$3$4');

    // 2. Update page imports in App.js and others
    // App.js specific replacements for moved pages
    if (file.endsWith('App.js')) {
        content = content.replace(/import\('\.\/pages\/Dashboard'\)/g, "import('./pages/student/Dashboard')");
        content = content.replace(/import\('\.\/pages\/Courses'\)/g, "import('./pages/student/Courses')");

        content = content.replace(/import\('\.\/pages\/admin\/AddLesson'\)/g, "import('./pages/teacher/AddLesson')");
        content = content.replace(/import\('\.\/pages\/admin\/DeleteLessons'\)/g, "import('./pages/teacher/DeleteLessons')");
        content = content.replace(/import\('\.\/pages\/admin\/EditCourse'\)/g, "import('./pages/teacher/EditCourse')");
    }

    // 3. Fix relative imports in recently moved files
    // If the file is in src/pages/student or src/pages/teacher, it might need one more ../ to access components or utils

    // Example: import ... from '../components/...' becomes import ... from '../../components/...'
    // But wait, some imports were already relative.
    // Best approach: check if file is in the new deeper directories and adjust.

    const isDeepPage = file.includes('pages\\student') || file.includes('pages\\teacher') || file.includes('pages/student') || file.includes('pages/teacher');

    if (isDeepPage) {
        // It was likely in src/pages/ or src/pages/admin/
        // If it was in src/pages/ (Dashboard, Courses), it went one level deeper.
        // If it was in src/pages/admin/ (AddLesson, etc), it stayed at same depth level (pages/teacher).

        const wasInRootPages = file.endsWith('Dashboard.js') || file.endsWith('Courses.js');

        if (wasInRootPages) {
            // Needs extra ../ for imports like '../components' -> '../../components'
            // '../context' -> '../../context'
            // '../firebase' -> '../../firebase'
            // '../utils' -> '../../utils'
            // '../layouts' -> '../../layouts'
            content = content.replace(/from ['"]\.\.\/(components|context|firebase|utils|layouts|styles)/g, "from '../../$1");
            content = content.replace(/from ['"]\.\.\/index.css/g, "from '../../index.css");
        }
    }

    // Fix imports for components moved to common
    // If a file imports '../components/VideoPlayer', and the file is in 'pages/student', 
    // it becomes '../../components/common/VideoPlayer' (handled by step 1 + step 3 combo? No, step 1 handles path, step 3 handles relativity).

    // Let's refine step 1:
    // It replaces '.../components/VideoPlayer' with '.../components/common/VideoPlayer'.
    // If we are deep, step 3 adds '../'.

    // Actually, safe way for step 1 is replacing specific string patterns regardless of depth?
    // No, imports are relative.

    // Let's rely on specific replacements.

    if (content !== originalContent) {
        console.log(`Updating imports in ${file}`);
        fs.writeFileSync(file, content, 'utf8');
    }
});
