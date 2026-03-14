const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // 1. Bump fontSize by 4px
            content = content.replace(/fontSize:\s*"(\d+)px"/g, (match, sizeStr) => {
                let s = parseInt(sizeStr, 10);
                s += 4; // Add 4 pixels to all fonts
                return `fontSize: "${s}px"`;
            });

            // 2. Increase padding for the small label boxes dynamically
            // Specifically targeting padding: "4px 8px" and "6px 12px" which are common in these small boxes.
            content = content.replace(/padding:\s*"4px 8px"/g, `padding: "6px 12px"`);
            content = content.replace(/padding:\s*"6px 12px"/g, `padding: "8px 16px"`);
            content = content.replace(/padding:\s*"8px 12px"/g, `padding: "10px 16px"`);

            fs.writeFileSync(fullPath, content);
        }
    }
}

const frontendDir = '/media/adi/New Volume/Projects/CodeGuild/frontend';
processDir(path.join(frontendDir, 'components'));
processDir(path.join(frontendDir, 'scenes'));
console.log('Successfully upscaled text and padding project-wide.');
