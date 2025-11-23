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

  const branchAlign = check.branchNameAlign ?? 'center';
  const serialAlign = check.serialNumberAlign ?? 'right';
  const accountAlign = check.accountHolderNameAlign ?? 'left';
  const micrAlign = check.micrLineAlign ?? 'center';

  const branchX = mmToPx(check.branchNameX, check.checkSize.width / 2);
  const branchY = mmToPx(check.branchNameY, 10);

  const serialX = mmToPx(check.serialNumberX, check.checkSize.width - 20);
  const serialY = mmToPx(check.serialNumberY, 18);

  const accountX = mmToPx(check.accountHolderNameX, 15);
  const accountY = mmToPx(check.accountHolderNameY, check.checkSize.height - 20);

  const micrX = mmToPx(check.micrLineX, check.checkSize.width / 2);
  const micrY = mmToPx(check.micrLineY, check.checkSize.height - 5);

  const branchFont = (check.branchNameFontSize ?? 14) * 1.5;
  const serialFont = (check.serialNumberFontSize ?? 12) * 1.4;
  const accountFont = (check.accountHolderNameFontSize ?? 11) * 1.4;
  const micrFont = (check.micrLineFontSize ?? 12) * 1.8;
  const micrDisplay = reorderMicrLine(check.micrLine);

  return `
    <div class="check-wrapper" style="width:${widthPx}px;height:${heightPx}px;">
      <section class="check">
      <div class="branch-name" style="left:${branchX}px;top:${branchY}px;font-size:${branchFont}px;text-align:${branchAlign};transform:${transformForAlign(branchAlign)};">
        ${escapeHtml(check.branchName)}
      </div>
      <div class="serial" style="left:${serialX}px;top:${serialY}px;font-size:${serialFont}px;text-align:${serialAlign};transform:${transformForAlign(serialAlign)};">
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
  const cairoFontUrl = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600&display=swap';
  const firstCheck = checkbookData.checks[0];
  const defaultWidthMm = firstCheck?.checkSize.width ?? 235;
  const defaultHeightMm = firstCheck?.checkSize.height ?? 86;

  const checksHtml = checkbookData.checks.map(renderCheckSection).join('\n');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>معاينة دفتر الشيكات</title>
  <link rel="stylesheet" href="${cairoFontUrl}" />
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

    .serial {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: 0.12em;
      direction: ltr;
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
