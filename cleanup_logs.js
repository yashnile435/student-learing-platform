const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            if (fs.statSync(dirFile).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                    filelist = walkSync(dirFile, filelist);
                }
            } else {
                if (file.endsWith('.js') || file.endsWith('.jsx')) {
                    filelist.push(dirFile);
                }
            }
        } catch (e) {
            // ignore
        }
    });
    return filelist;
}

const files = walkSync(path.join(__dirname, 'src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Remove lines that are just console.log/warn/error/info (user said "Remove: All console.log statements", maybe keep error?)
    // User said "Keep only production-safe logging if required."
    // Usually console.error is kept. I will remove console.log only.

    content = content.replace(/^\s*console\.log\(.*\);?\s*$/gm, '');
    content = content.replace(/console\.log\(.*?\);?/g, '');

    if (content !== original) {
        console.log('Fixed', file);
        fs.writeFileSync(file, content, 'utf8');
    }
});
