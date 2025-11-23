const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, 'server/src/fonts/arabic-font.ttf');
try {
    const base64Font = fs.readFileSync(fontPath, { encoding: 'base64' });
    console.log(base64Font);
} catch (err) {
    console.error('Error reading font file:', err);
}
