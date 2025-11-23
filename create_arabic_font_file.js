const fs = require('fs');
const path = require('path');

const base64Path = path.join(__dirname, 'arabic_base64.txt');
const outputPath = path.join(__dirname, 'client/src/lib/utils/arabicFont.ts');

try {
    const base64Content = fs.readFileSync(base64Path, 'utf8').trim();
    const fileContent = `/**
 * Arabic Font (Cairo Regular) for jsPDF
 */

export const ARABIC_FONT_BASE64 = '${base64Content}';

/**
 * Add Arabic font to jsPDF instance
 */
export function addArabicFont(pdf: any) {
  if (ARABIC_FONT_BASE64) {
    pdf.addFileToVFS('Cairo-Regular.ttf', ARABIC_FONT_BASE64);
    pdf.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
  }
}
`;

    fs.writeFileSync(outputPath, fileContent);
    console.log('Successfully created arabicFont.ts');
} catch (err) {
    console.error('Error creating font file:', err);
}
