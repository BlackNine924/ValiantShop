
const fs = require('fs');

function checkJSX(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let stack = [];
    
    // Improved regex to handle basic JSX tags, including fragments
    // Matches <Tag, </Tag, <>, </>
    const tagRegex = /<(\/?[a-zA-Z0-9\._]+|>|)/g;

    lines.forEach((line, index) => {
        let match;
        // Simple search for tags, skipping common JS-only usages if possible
        // This is still primitive but better
        const tagLineRegex = /<(\/?[a-zA-Z0-9\._]*|>?)/g;
        
        let pos = 0;
        while ((match = tagLineRegex.exec(line)) !== null) {
            const tagName = match[1];
            if (!tagName) continue;
            
            // Skip if it looks like a comparison (e.g. i < length)
            // If there's a space after < and it's not a tag name, skip
            if (tagName === '' && line[match.index + 1] === ' ') continue;

            if (tagName.startsWith('/')) {
                const name = tagName.slice(1) || ''; // Fragment is empty string
                if (stack.length === 0) {
                    console.log(`Error: Unexpected closing tag </${name}> at line ${index + 1}`);
                } else {
                    const last = stack.pop();
                    if (last.name !== name) {
                        console.log(`Error: Mismatched tag. Expected </${last.name}> (from line ${last.line}), but found </${name}> at line ${index + 1}`);
                    }
                }
            } else if (!line.slice(match.index).includes('/>')) {
                // If it's a self-closing tag name like img, input, etc, or has />
                const normalizedName = tagName || ''; // Fragment is empty
                const selfClosing = ['img', 'input', 'hr', 'br'].includes(normalizedName.toLowerCase());
                
                // Check for /> on the same line after the tag starts
                const restOfLine = line.slice(match.index);
                const tagEndMatch = restOfLine.match(/>/);
                if (tagEndMatch) {
                    const tagContent = restOfLine.slice(0, tagEndMatch.index + 1);
                    if (tagContent.endsWith('/>')) {
                        continue;
                    }
                }

                if (!selfClosing) {
                    stack.push({ name: normalizedName, line: index + 1 });
                }
            }
        }
    });

    stack.forEach(tag => {
        console.log(`Error: Unclosed tag <${tag.name}> opened at line ${tag.line}`);
    });
}

checkJSX('c:/Users/User/.gemini/antigravity/scratch/ValiantShop/src/pages/AdminDashboard.tsx');
