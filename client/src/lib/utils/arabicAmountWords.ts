/**
 * تفقيط المبالغ بالأسلوب المصرفي الليبي:
 * الآحاد ثم العشرات (تسعة وأربعون، سبعة وعشرون)
 * الدرهم = جزء من ألف (3 خانات عشرية)
 */

const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const TEENS = [
  'عشرة',
  'أحد عشر',
  'اثنا عشر',
  'ثلاثة عشر',
  'أربعة عشر',
  'خمسة عشر',
  'ستة عشر',
  'سبعة عشر',
  'ثمانية عشر',
  'تسعة عشر',
];
const TENS = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = [
  '',
  'مائة',
  'مائتان',
  'ثلاثمائة',
  'أربعمائة',
  'خمسمائة',
  'ستمائة',
  'سبعمائة',
  'ثمانمائة',
  'تسعمائة',
];

function joinAnd(parts: string[]): string {
  return parts.filter(Boolean).join(' و');
}

/** تحويل 0–999: مئات ثم آحاد ثم عشرات */
function convertBelowThousand(n: number): string {
  if (n <= 0) return '';

  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];

  if (h > 0) parts.push(HUNDREDS[h]);

  if (rest > 0) {
    if (rest < 10) {
      parts.push(ONES[rest]);
    } else if (rest < 20) {
      parts.push(TEENS[rest - 10]);
    } else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      if (o > 0) {
        parts.push(ONES[o], TENS[t]);
      } else {
        parts.push(TENS[t]);
      }
    }
  }

  return joinAnd(parts);
}

function convertThousands(thousands: number): string {
  if (thousands === 1) return 'ألف';
  if (thousands === 2) return 'ألفان';
  if (thousands >= 3 && thousands <= 10) return `${convertBelowThousand(thousands)} آلاف`;
  return `${convertBelowThousand(thousands)} ألف`;
}

function convertMillions(millions: number): string {
  if (millions === 1) return 'مليون';
  if (millions === 2) return 'مليونان';
  if (millions >= 3 && millions <= 10) return `${convertBelowThousand(millions)} ملايين`;
  return `${convertBelowThousand(millions)} مليون`;
}

export function numberToArabicWords(num: number): string {
  const value = Math.floor(Math.abs(num));
  if (value === 0) return 'صفر';

  const billions = Math.floor(value / 1_000_000_000);
  const millions = Math.floor((value % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((value % 1_000_000) / 1000);
  const remainder = value % 1000;
  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) parts.push('مليار');
    else if (billions === 2) parts.push('ملياران');
    else if (billions <= 10) parts.push(`${convertBelowThousand(billions)} مليارات`);
    else parts.push(`${convertBelowThousand(billions)} مليار`);
  }

  if (millions > 0) parts.push(convertMillions(millions));
  if (thousands > 0) parts.push(convertThousands(thousands));
  if (remainder > 0) parts.push(convertBelowThousand(remainder));

  return joinAnd(parts);
}

function parseAmount(amount: number | string): number {
  if (typeof amount === 'number') return amount;
  const normalized = String(amount).trim().replace(/,/g, '');
  return parseFloat(normalized);
}

export function amountToArabicTafqeet(amount: number | string): string {
  const numeric = parseAmount(amount);
  if (!Number.isFinite(numeric) || numeric < 0) return '';

  const rounded = Math.round(numeric * 1000) / 1000;
  const dinars = Math.floor(rounded + 1e-9);
  const dirhams = Math.round((rounded - dinars) * 1000);

  const parts: string[] = [];
  if (dinars > 0) {
    parts.push(`${numberToArabicWords(dinars)} دينار`);
  }
  if (dirhams > 0) {
    parts.push(`${numberToArabicWords(dirhams)} درهم`);
  }
  if (!parts.length) {
    return 'صفر دينار لا غير';
  }
  return `${parts.join(' و')} لا غير`;
}
