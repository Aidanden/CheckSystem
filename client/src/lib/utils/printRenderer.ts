interface CheckSize {
  width: number;
  height: number;
  unit: string;
}

interface CheckData {
  checkNumber: number;
  serialNumber: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
  routingNumber: string;
  branchName: string;
  micrLine: string;
  checkSize: CheckSize;
  branchNameX?: number;
  branchNameY?: number;
  branchNameFontSize?: number;
  branchNameAlign?: 'left' | 'center' | 'right';
  serialNumberX?: number;
  serialNumberY?: number;
  serialNumberFontSize?: number;
  serialNumberAlign?: 'left' | 'center' | 'right';
  accountNumberX?: number;
  accountNumberY?: number;
  accountNumberFontSize?: number;
  accountNumberAlign?: 'left' | 'center' | 'right';
  checkSequenceX?: number;
  checkSequenceY?: number;
  checkSequenceFontSize?: number;
  checkSequenceAlign?: 'left' | 'center' | 'right';
  accountHolderNameX?: number;
  accountHolderNameY?: number;
  accountHolderNameFontSize?: number;
  accountHolderNameAlign?: 'left' | 'center' | 'right';
  micrLineX?: number;
  micrLineY?: number;
  micrLineFontSize?: number;
  micrLineAlign?: 'left' | 'center' | 'right';
}

interface OperationMeta {
  accountNumber: string;
  accountHolderName: string;
  accountType: number;
  branchName: string;
  routingNumber: string;
  serialFrom: number;
  serialTo: number;
  sheetsPrinted: number;
  printDate: string | Date;
}

export interface CheckbookData {
  operation: OperationMeta;
  checks: CheckData[];
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const MICR_TRANSIT = '⑆';
const MICR_ON_US = '⑈';

const reorderMicrLine = (value: string) => {
  // Parse the MICR line which now comes as: type routing account serial
  const parts = value.trim().split(/\s+/);
  if (parts && parts.length >= 4) {
    const [type, routing, account, serial] = parts;

    // Format: Type Routing Account Serial (right to left)
    // With MICR delimiters for proper formatting
    return `${type} ${MICR_TRANSIT}${routing}${MICR_TRANSIT} ${MICR_ON_US}${account}${MICR_ON_US} ${MICR_ON_US}${serial}${MICR_ON_US}`;
  }
  return value;
};

const transformForAlign = (align: 'left' | 'center' | 'right' = 'left') => {
  switch (align) {
    case 'center':
      return 'translateX(-50%)';
    case 'right':
      return 'translateX(-100%)';
    default:
      return 'none';
  }
};

function renderCheckSection(check: CheckData): string {
  // استخدام mm مباشرة للطباعة الدقيقة
  const widthMm = check.checkSize.width;
  const heightMm = check.checkSize.height;

  const branchAlign = check.branchNameAlign ?? 'left';
  const serialAlign = check.serialNumberAlign ?? 'right';
  const accountNumAlign = check.accountNumberAlign ?? 'center';
  const checkSeqAlign = check.checkSequenceAlign ?? 'left';
  const accountAlign = check.accountHolderNameAlign ?? 'left';
  const micrAlign = check.micrLineAlign ?? 'center';

  // المواقع بالمليمتر
  const branchX = check.branchNameX ?? 20;
  const branchY = check.branchNameY ?? 10;

  const accountNumX = check.accountNumberX ?? (widthMm / 2);
  const accountNumY = check.accountNumberY ?? 10;

  const serialX = check.serialNumberX ?? (widthMm - 20);
  const serialY = check.serialNumberY ?? 18;

  const checkSeqX = check.checkSequenceX ?? 20;
  const checkSeqY = check.checkSequenceY ?? 18;

  const accountX = check.accountHolderNameX ?? 15;
  const accountY = check.accountHolderNameY ?? (heightMm - 20);

  const micrX = check.micrLineX ?? (widthMm / 2);
  const micrY = check.micrLineY ?? (heightMm - 5);

  // أحجام الخطوط بالنقاط (pt)
  const branchFont = check.branchNameFontSize ?? 14;
  const accountNumFont = check.accountNumberFontSize ?? 14;
  const serialFont = check.serialNumberFontSize ?? 12;
  const checkSeqFont = check.checkSequenceFontSize ?? 12;
  const accountFont = check.accountHolderNameFontSize ?? 11;
  const micrFont = check.micrLineFontSize ?? 12;
  const micrDisplay = reorderMicrLine(check.micrLine);

  return `
    <div class="check-wrapper" style="width:${widthMm}mm;height:${heightMm}mm;">
      <section class="check" style="width:${widthMm}mm;height:${heightMm}mm;">
      <div class="branch-name" style="left:${branchX}mm;top:${branchY}mm;font-size:${branchFont}pt;text-align:${branchAlign};transform:${transformForAlign(branchAlign)};">
        ${escapeHtml(check.branchName)}
      </div>
      <div class="account-number" style="left:${accountNumX}mm;top:${accountNumY}mm;font-size:${accountNumFont}pt;text-align:${accountNumAlign};transform:${transformForAlign(accountNumAlign)};">
        ${escapeHtml(check.accountNumber)}
      </div>
      <div class="serial" style="left:${serialX}mm;top:${serialY}mm;font-size:${serialFont}pt;text-align:${serialAlign};transform:${transformForAlign(serialAlign)};">
        ${escapeHtml(check.serialNumber)}
      </div>
      <div class="check-sequence" style="left:${checkSeqX}mm;top:${checkSeqY}mm;font-size:${checkSeqFont}pt;text-align:${checkSeqAlign};transform:${transformForAlign(checkSeqAlign)};">
        ${escapeHtml(check.serialNumber)}
      </div>
      <div class="account-holder" style="left:${accountX}mm;top:${accountY}mm;font-size:${accountFont}pt;text-align:${accountAlign};transform:${transformForAlign(accountAlign)};">
        ${escapeHtml(check.accountHolderName)}
      </div>
      <div class="micr-line" style="left:${micrX}mm;top:${micrY}mm;font-size:${micrFont}pt;text-align:${micrAlign};transform:${transformForAlign(micrAlign)};">
        ${escapeHtml(micrDisplay)}
      </div>
      </section>
    </div>
  `;
}

export default function renderCheckbookHtml(checkbookData: CheckbookData): string {
  if (typeof window === 'undefined') {
    throw new Error('لا يمكن إنشاء صفحة الطباعة خارج بيئة المتصفح');
  }

  const micrFontUrl = new URL('/font/micrenc.ttf', window.location.origin).toString();
  const firstCheck = checkbookData.checks[0];
  const defaultWidthMm = firstCheck?.checkSize.width ?? 235;
  const defaultHeightMm = firstCheck?.checkSize.height ?? 86;

  const checksHtml = checkbookData.checks.map(renderCheckSection).join('\n');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>طباعة دفتر الشيكات</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${defaultWidthMm}mm ${defaultHeightMm}mm;
      margin: 0;
    }

    @font-face {
      font-family: 'MICR';
      src: url('${micrFontUrl}') format('truetype');
      font-weight: normal;
      font-style: normal;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #111827;
    }

    .check-wrapper {
      margin: 0;
      padding: 0;
      width: ${defaultWidthMm}mm;
      height: ${defaultHeightMm}mm;
      display: block;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
    }

    /* إزالة page-break من آخر شيك */
    .check-wrapper:last-child {
      page-break-after: auto;
    }

    .check {
      position: relative;
      width: ${defaultWidthMm}mm;
      height: ${defaultHeightMm}mm;
      background: #fff;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    .check div {
      position: absolute;
      direction: rtl;
    }

    .branch-name,
    .account-holder {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-weight: 600;
      direction: rtl;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .account-number,
    .serial,
    .check-sequence {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.12em;
      direction: ltr;
      font-weight: bold;
    }

    .micr-line {
      font-family: 'MICR', 'MICR E-13B', 'Courier New', monospace;
      letter-spacing: 0.15em;
      direction: rtl;
      white-space: nowrap;
    }

    @media print {
      html, body {
        margin: 0;
        padding: 0;
        width: auto;
        height: auto;
      }
      
      .check-wrapper {
        width: ${defaultWidthMm}mm;
        height: ${defaultHeightMm}mm;
        margin: 0;
        padding: 0;
        page-break-after: always;
        page-break-inside: avoid;
      }

      .check-wrapper:last-child {
        page-break-after: auto;
      }
      
      .check {
        box-shadow: none;
        border: none;
        width: ${defaultWidthMm}mm;
        height: ${defaultHeightMm}mm;
      }
    }
    
    @media screen {
      body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        min-height: 100vh;
        background: #f3f4f6;
        padding: 20px;
      }
      
      .check-wrapper {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        background: #fff;
      }
    }
  </style>
</head>
<body>
  ${checksHtml}
</body>
</html>`;
}
