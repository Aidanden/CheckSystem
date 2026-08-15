/** تحويل الأرقام العربية/الفارسية إلى لاتينية مع الإبقاء على الأصفار البادئة */
function toAsciiDigits(value: string | number | null | undefined): string {
  const arabic = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  return [...String(value ?? '')]
    .map((ch) => {
      const i = arabic.indexOf(ch);
      if (i >= 0) return String(i);
      const j = persian.indexOf(ch);
      if (j >= 0) return String(j);
      return ch;
    })
    .join('')
    .replace(/\D/g, '');
}

export function micrDigits(value: string | number | null | undefined, length: number) {
  const digits = toAsciiDigits(value);
  // padStart فقط: لا نقصّ من اليمين حتى لا تُحذف الأصفار البادئة في الرقم المحاسبي
  return digits.padStart(length, '0');
}

export function buildMicrLine(instrumentNo?: string | null, routingNumber?: string | null, accountingNumber?: string | null) {
  return `C${micrDigits(instrumentNo || '0', 9)}C A${micrDigits(routingNumber, 8)}A ${micrDigits(accountingNumber, 10)}C 03`;
}

export interface InstrumentPrintData {
  instrumentNo?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  beneficiaryName?: string | null;
  amount?: number | null;
  amountWords?: string | null;
  issueDate?: string | null;
  branchName?: string | null;
  routingNumber?: string | null;
  accountingNumber?: string | null;
}

function isUsablePos(p: Partial<{ x: number; y: number; fontSize: number; align: string }> | null | undefined): p is { x: number; y: number; fontSize: number; align: string } {
  if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return false;
  if (Number.isNaN(p.x) || Number.isNaN(p.y)) return false;
  if (p.x < 0 || p.y < 0) return false;
  if ((p.fontSize ?? 0) <= 0) return false;
  return true;
}

function resolvePos(
  settings: any,
  key: string,
  fallback: { x: number; y: number; fontSize: number; align: string }
) {
  const nested = settings?.[key];
  if (isUsablePos(nested)) {
    return {
      x: nested.x,
      y: nested.y,
      fontSize: nested.fontSize ?? fallback.fontSize,
      align: (nested.align as string) || fallback.align,
    };
  }

  const fromFlat = {
    x: Number(settings?.[`${key}X`]),
    y: Number(settings?.[`${key}Y`]),
    fontSize: Number(settings?.[`${key}FontSize`]),
    align: (settings?.[`${key}Align`] as string) || fallback.align,
  };
  if (isUsablePos(fromFlat)) return fromFlat;
  return fallback;
}

function alignTransform(align: string, asAmount = false) {
  if (align === 'center') return 'translateX(-50%)';
  if (asAmount && align === 'right') return 'translateX(-100%)';
  return 'none';
}

export function buildCertifiedInstrumentPrintHtml(instrument: InstrumentPrintData, amountWords: string, settings: any) {
  const checkWidth = settings?.checkWidth ?? 235;
  const checkHeight = settings?.checkHeight ?? 86;
  const beneficiary = resolvePos(settings, 'beneficiaryName', { x: 155, y: 41, fontSize: 8, align: 'right' });
  const accountHolder = resolvePos(settings, 'accountHolderName', { x: 30, y: 18, fontSize: 8, align: 'right' });
  const accountNumber = resolvePos(settings, 'accountNumber', { x: 30, y: 12, fontSize: 8, align: 'right' });
  const checkNumber = resolvePos(settings, 'checkNumber', { x: 185, y: 18, fontSize: 8, align: 'left' });
  const branchNamePos = resolvePos(settings, 'branchName', { x: 110, y: 4, fontSize: 8, align: 'center' });
  const amountNumbers = resolvePos(settings, 'amountNumbers', { x: 200, y: 42, fontSize: 8, align: 'right' });
  const amountWordsPos = resolvePos(settings, 'amountWords', { x: 117.5, y: 48, fontSize: 8, align: 'center' });
  const issueDate = resolvePos(settings, 'issueDate', { x: 185, y: 12, fontSize: 8, align: 'left' });
  const stubDate = resolvePos(settings, 'stubDate', { x: 25, y: 6, fontSize: 8, align: 'left' });
  const stubCheckNumber = resolvePos(settings, 'stubCheckNumber', { x: 25, y: 16.5, fontSize: 8, align: 'left' });
  const stubBeneficiary = resolvePos(settings, 'stubBeneficiary', { x: 15, y: 22, fontSize: 8, align: 'left' });
  const stubAmount = resolvePos(settings, 'stubAmount', { x: 24, y: 29.5, fontSize: 8, align: 'left' });
  const micr = resolvePos(settings, 'micrLine', { x: 138.5, y: 75, fontSize: 14, align: 'center' });

  const amount = Number(instrument.amount) || 0;
  const dinars = Math.floor(amount);
  const dirhams = Math.round((amount - dinars) * 1000);
  const amountFormatted = `${dinars}.${String(dirhams).padStart(3, '0')}`;
  const micrLine = buildMicrLine(instrument.instrumentNo, instrument.routingNumber, instrument.accountingNumber);
  const issue = instrument.issueDate || '';
  const micrFontUrl =
    typeof window !== 'undefined' ? new URL('/font/micrenc.ttf', window.location.origin).toString() : '/font/micrenc.ttf';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>طباعة صك مصدق - ${instrument.instrumentNo || ''}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${checkWidth}mm ${checkHeight}mm; margin: 0; }
    @font-face { font-family: 'MICR'; src: url('${micrFontUrl}') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check { position: relative; width: ${checkWidth}mm; height: ${checkHeight}mm; overflow: hidden; }
    .field { position: absolute; white-space: nowrap; color: #000; }
    .account-holder { left:${accountHolder.x}mm; top:${accountHolder.y}mm; font-size:${accountHolder.fontSize}pt; text-align:${accountHolder.align}; font-weight:600; transform:${alignTransform(accountHolder.align)}; }
    .account-number { left:${accountNumber.x}mm; top:${accountNumber.y}mm; font-size:${accountNumber.fontSize}pt; text-align:${accountNumber.align}; font-family:'Courier New',monospace; direction:ltr; transform:${alignTransform(accountNumber.align)}; }
    .beneficiary { left:${beneficiary.x}mm; top:${beneficiary.y}mm; font-size:${beneficiary.fontSize}pt; text-align:${beneficiary.align}; font-weight:600; transform:${alignTransform(beneficiary.align)}; }
    .check-number { left:${checkNumber.x}mm; top:${checkNumber.y}mm; font-size:${checkNumber.fontSize}pt; text-align:${checkNumber.align}; font-family:'Courier New',monospace; font-weight:bold; direction:ltr; transform:${alignTransform(checkNumber.align)}; }
    .branch-name { left:${branchNamePos.x}mm; top:${branchNamePos.y}mm; font-size:${branchNamePos.fontSize}pt; text-align:${branchNamePos.align}; font-weight:600; transform:${alignTransform(branchNamePos.align)}; }
    .amount-n { left:${amountNumbers.x}mm; top:${amountNumbers.y}mm; font-size:${amountNumbers.fontSize}pt; text-align:${amountNumbers.align}; font-weight:bold; font-family:'Courier New',monospace; direction:ltr; transform:${alignTransform(amountNumbers.align, true)}; }
    .amount-w { left:${amountWordsPos.x}mm; top:${amountWordsPos.y}mm; font-size:${amountWordsPos.fontSize}pt; text-align:${amountWordsPos.align}; max-width:150mm; white-space:normal; transform:${alignTransform(amountWordsPos.align)}; }
    .issue { left:${issueDate.x}mm; top:${issueDate.y}mm; font-size:${issueDate.fontSize}pt; text-align:${issueDate.align}; transform:${alignTransform(issueDate.align)}; }
    .stub-date { left:${stubDate.x}mm; top:${stubDate.y}mm; font-size:${stubDate.fontSize}pt; text-align:${stubDate.align}; }
    .stub-check { left:${stubCheckNumber.x}mm; top:${stubCheckNumber.y}mm; font-size:${stubCheckNumber.fontSize}pt; text-align:${stubCheckNumber.align}; }
    .stub-benef { left:${stubBeneficiary.x}mm; top:${stubBeneficiary.y}mm; font-size:${stubBeneficiary.fontSize}pt; text-align:${stubBeneficiary.align}; max-width:28mm; overflow:hidden; }
    .stub-amount { left:${stubAmount.x}mm; top:${stubAmount.y}mm; font-size:${stubAmount.fontSize}pt; text-align:${stubAmount.align}; direction:ltr; }
    .micr-line { position:absolute; left:${micr.x}mm; top:${micr.y}mm; font-size:${micr.fontSize}pt; text-align:${micr.align}; font-family:'MICR',monospace; letter-spacing:0.15em; direction:ltr; white-space:nowrap; font-weight:bold; transform:${alignTransform(micr.align)}; }
  </style>
</head>
<body>
  <section class="check">
    <div class="field stub-date">${issue}</div>
    <div class="field stub-check">${instrument.instrumentNo || ''}</div>
    <div class="field stub-benef">${instrument.beneficiaryName || ''}</div>
    <div class="field stub-amount">${amountFormatted}</div>
    <div class="field check-number">${instrument.instrumentNo || ''}</div>
    <div class="field branch-name">${instrument.branchName || ''}</div>
    <div class="field issue">${issue}</div>
    <div class="field account-holder">${instrument.accountHolderName || ''}</div>
    <div class="field account-number">${instrument.accountNumber || ''}</div>
    <div class="field beneficiary">${instrument.beneficiaryName || ''}</div>
    <div class="field amount-n">${amountFormatted}</div>
    <div class="field amount-w">${amountWords || ''}</div>
    <div class="micr-line">${micrLine}</div>
  </section>
  <script>window.onload=()=>setTimeout(()=>window.print(),400);</script>
</body>
</html>`;
}

export function openCertifiedInstrumentPrint(instrument: InstrumentPrintData, amountWords: string, settings: any) {
  const html = buildCertifiedInstrumentPrintHtml(instrument, amountWords, settings);
  const win = window.open('', '_blank', 'width=1024,height=768');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
