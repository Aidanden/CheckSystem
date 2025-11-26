const MM_TO_PX = 3.7795275591;

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

const mmToPx = (value?: number, fallback = 0) => {
  const source = value ?? fallback;
  return source * MM_TO_PX;
};

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
  const parts = value.match(/"[^"]*"|'[^']*'|[^\s]+/g);
  if (parts && parts.length >= 4) {
    const [serial, account, routing, type] = parts;
    const clean = (text: string) => text.replace(/^['"]|['"]$/g, '');
    const serialClean = clean(serial);
    const accountClean = clean(account);
    const routingClean = clean(routing);
    const typeClean = clean(type);

    return `${typeClean} ${MICR_ON_US}${accountClean}${MICR_ON_US} ${MICR_TRANSIT}${routingClean}${MICR_TRANSIT} ${MICR_ON_US}${serialClean}${MICR_ON_US}`;
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
  const widthPx = mmToPx(check.checkSize.width);
  const heightPx = mmToPx(check.checkSize.height);

  const branchAlign = check.branchNameAlign ?? 'left';
  const serialAlign = check.serialNumberAlign ?? 'right';
  const accountNumAlign = check.accountNumberAlign ?? 'center';
  const checkSeqAlign = check.checkSequenceAlign ?? 'left';
  const accountAlign = check.accountHolderNameAlign ?? 'left';
  const micrAlign = check.micrLineAlign ?? 'center';

  const branchX = mmToPx(check.branchNameX, 20);
  const branchY = mmToPx(check.branchNameY, 10);

  const accountNumX = mmToPx(check.accountNumberX, check.checkSize.width / 2);
  const accountNumY = mmToPx(check.accountNumberY, 10);

  const serialX = mmToPx(check.serialNumberX, check.checkSize.width - 20);
  const serialY = mmToPx(check.serialNumberY, 18);

  const checkSeqX = mmToPx(check.checkSequenceX, 20);
  const checkSeqY = mmToPx(check.checkSequenceY, 18);

  const accountX = mmToPx(check.accountHolderNameX, 15);
  const accountY = mmToPx(check.accountHolderNameY, check.checkSize.height - 20);

  const micrX = mmToPx(check.micrLineX, check.checkSize.width / 2);
  const micrY = mmToPx(check.micrLineY, check.checkSize.height - 5);

  const branchFont = (check.branchNameFontSize ?? 14) * 1.5;
  const accountNumFont = (check.accountNumberFontSize ?? 14) * 1.5;
  const serialFont = (check.serialNumberFontSize ?? 12) * 1.4;
  const checkSeqFont = (check.checkSequenceFontSize ?? 12) * 1.4;
  const accountFont = (check.accountHolderNameFontSize ?? 11) * 1.4;
  const micrFont = (check.micrLineFontSize ?? 12) * 1.8;
  const micrDisplay = reorderMicrLine(check.micrLine);

  return `
    <div class="check-wrapper" style="width:${widthPx}px;height:${heightPx}px;">
      <section class="check">
      <div class="branch-name" style="left:${branchX}px;top:${branchY}px;font-size:${branchFont}px;text-align:${branchAlign};transform:${transformForAlign(branchAlign)};">
        ${escapeHtml(check.branchName)}
      </div>
      <div class="account-number" style="left:${accountNumX}px;top:${accountNumY}px;font-size:${accountNumFont}px;text-align:${accountNumAlign};transform:${transformForAlign(accountNumAlign)};">
        ${escapeHtml(check.accountNumber)}
      </div>
      <div class="serial" style="left:${serialX}px;top:${serialY}px;font-size:${serialFont}px;text-align:${serialAlign};transform:${transformForAlign(serialAlign)};">
        ${escapeHtml(check.serialNumber)}
      </div>
      <div class="check-sequence" style="left:${checkSeqX}px;top:${checkSeqY}px;font-size:${checkSeqFont}px;text-align:${checkSeqAlign};transform:${transformForAlign(checkSeqAlign)};">
        ${escapeHtml(check.serialNumber)}
      </div>
      <div class="account-holder" style="left:${accountX}px;top:${accountY}px;font-size:${accountFont}px;text-align:${accountAlign};transform:${transformForAlign(accountAlign)};">
        ${escapeHtml(check.accountHolderName)}
      </div>
      <div class="micr-line" style="left:${micrX}px;top:${micrY}px;font-size:${micrFont}px;text-align:${micrAlign};transform:${transformForAlign(micrAlign)};">
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
  <title>معاينة دفتر الشيكات</title>
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

    body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #111827;
    }

    .check-wrapper {
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      padding: 0;
    }

    .check {
      position: relative;
      width: 100%;
      height: 100%;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      padding: 24px;
      overflow: hidden;
    }

    .check::after {
      content: '';
      position: absolute;
      inset: 16px;
      border: 1px dashed rgba(15, 23, 42, 0.1);
      border-radius: 8px;
      pointer-events: none;
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
      direction: ltr;
    }

    @media print {
      .check {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  ${checksHtml}
</body>
</html>`;
}
