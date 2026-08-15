export function numberToArabicWords(num: number): string {
  if (num === 0) return 'صفر';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';

    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const o = n % 10;

    let result = '';
    if (h > 0) result += hundreds[h];

    if (t === 1) {
      if (result) result += ' و';
      result += teens[o];
    } else {
      if (t > 0) {
        if (result) result += ' و';
        result += tens[t];
      }
      if (o > 0) {
        if (result) result += ' و';
        result += ones[o];
      }
    }

    return result;
  };

  if (num < 1000) {
    return convertGroup(num);
  }

  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = '';
    if (thousands === 1) result = 'ألف';
    else if (thousands === 2) result = 'ألفان';
    else if (thousands <= 10) result = convertGroup(thousands) + ' آلاف';
    else result = convertGroup(thousands) + ' ألفاً';

    if (remainder > 0) result += ' و' + convertGroup(remainder);
    return result;
  }

  const millions = Math.floor(num / 1000000);
  const remainder = num % 1000000;
  let result = '';
  if (millions === 1) result = 'مليون';
  else if (millions === 2) result = 'مليونان';
  else if (millions <= 10) result = convertGroup(millions) + ' ملايين';
  else result = convertGroup(millions) + ' مليوناً';

  if (remainder > 0) {
    result += ' و' + numberToArabicWords(remainder);
  }

  return result;
}

export function amountToArabicTafqeet(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(numeric) || numeric < 0) return '';

  const dinars = Math.floor(numeric);
  const dirhams = Math.round((numeric - dinars) * 1000);

  let words = '';
  if (dinars > 0) {
    words = numberToArabicWords(dinars) + ' دينار ليبي';
  }
  if (dirhams > 0) {
    if (words) words += ' و';
    words += numberToArabicWords(dirhams) + ' درهم';
  }
  if (!words) words = 'صفر دينار ليبي';
  return words + ' لا غير';
}
