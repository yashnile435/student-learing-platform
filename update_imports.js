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

    // Update firebase imports
    content = content.replace(/from ['"](\.\.\/)*firebase['"]/g, (match) => {
        return match.replace('firebase', 'firebase/config');
    });

    // Update services imports to utils
    content = content.replace(/services\/paymentService/g, 'utils/paymentService');
    content = content.replace(/services\/progressService/g, 'utils/progressService');

    if (content !== originalContent) {
        console.log(`Updating ${file}`);
        fs.writeFileSync(file, content, 'utf8');
    }
});
