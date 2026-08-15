'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, Stamp, AlertCircle } from 'lucide-react';
import { soapService, certifiedCheckService, certifiedInstrumentLogService, type SoapInstrumentResponse } from '@/lib/api';
import { amountToArabicTafqeet } from '@/lib/utils/arabicAmountWords';

interface PrintPosition {
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

const DEFAULT_POS: PrintPosition = { x: 20, y: 20, fontSize: 12, align: 'right' };

function isUsablePosition(p: Partial<PrintPosition> | null | undefined, checkWidth: number, checkHeight: number): p is PrintPosition {
  if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') return false;
  if (Number.isNaN(p.x) || Number.isNaN(p.y)) return false;
  if (p.x < 0 || p.y < 0) return false;
  if (p.x > checkWidth || p.y > checkHeight) return false;
  if ((p.fontSize ?? 0) <= 0) return false;
  return true;
}

function pos(data: any, prefix: string, fallback: PrintPosition, checkWidth = 235, checkHeight = 86): PrintPosition {
  const fromFlat: PrintPosition = {
    x: Number(data?.[prefix]),
    y: Number(data?.[prefix.replace(/X$/, 'Y')]),
    fontSize: Number(data?.[prefix.replace(/X$/, 'FontSize')]),
    align: (data?.[prefix.replace(/X$/, 'Align')] as PrintPosition['align']) || fallback.align,
  };
  if (isUsablePosition(fromFlat, checkWidth, checkHeight)) {
    return fromFlat;
  }

  const nested = data?.[prefix.replace(/X$/, '')];
  if (isUsablePosition(nested, checkWidth, checkHeight)) {
    return {
      x: nested.x,
      y: nested.y,
      fontSize: nested.fontSize ?? fallback.fontSize,
      align: (nested.align as PrintPosition['align']) ?? fallback.align,
    };
  }

  return fallback;
}

function micrDigits(value: string | number | undefined, length: number) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length > length) return digits.slice(-length);
  return digits.padStart(length, '0');
}

/** نفس سطر الترميز المستخدم في الطباعة */
function buildMicrLine(instrumentNo: string, routingNumber?: string, accountingNumber?: string) {
  const serialStr = micrDigits(instrumentNo, 9);
  const routingStr = micrDigits(routingNumber, 8);
  const accountingStr = micrDigits(accountingNumber, 10);
  return `C${serialStr}C A${routingStr}A ${accountingStr}C 03`;
}

export default function CertifiedInstrumentPage() {
  const [txnRefNo, setTxnRefNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<SoapInstrumentResponse | null>(null);
  const [amountWords, setAmountWords] = useState('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    certifiedCheckService.getSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnRefNo.trim()) return;

    setLoading(true);
    setError(null);
    setInstrument(null);

    try {
      const result = await soapService.queryInstrument({ txnRefNo: txnRefNo.trim() });
      setInstrument(result);
      setAmountWords(amountToArabicTafqeet(result.amount));
    } catch (err: any) {
      setError(err?.response?.data?.details || err?.response?.data?.error || err.message || 'فشل الاستعلام عن الصك المصدق');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!instrument) return;

    if (!amountWords.trim()) {
      setError('خانة التفقيط فارغة. أدخل القيمة بالحروف قبل الطباعة.');
      return;
    }

    if (!instrument.branchName) {
      setError('لا يمكن الطباعة: اسم الفرع غير متوفر من قاعدة بيانات النظام.');
      return;
    }

    if (!instrument.routingNumber || !instrument.accountingNumber) {
      setError('لا يمكن الطباعة: الرقم التوجيهي أو الرقم المحاسبي غير متوفرين من بيانات الفرع.');
      return;
    }

    const checkWidth = settings?.checkWidth ?? 235;
    const checkHeight = settings?.checkHeight ?? 86;
    const beneficiary = { x: 155, y: 41, fontSize: 8, align: 'right' as const };
    const accountHolder = { x: 30, y: 18, fontSize: 8, align: 'right' as const };
    const accountNumber = { x: 30, y: 12, fontSize: 8, align: 'right' as const };
    const checkNumber = { x: 185, y: 18, fontSize: 8, align: 'left' as const };
    const branchNamePos = pos(settings, 'branchNameX', { x: 110, y: 4, fontSize: 8, align: 'center' }, checkWidth, checkHeight);
    const amountNumbers = { x: 200, y: 42, fontSize: 8, align: 'right' as const };
    const amountWordsPos = { x: 117.5, y: 48, fontSize: 8, align: 'center' as const };
    const issueDate = { x: 185, y: 12, fontSize: 8, align: 'left' as const };
    const stubDate = settings?.stubDate ?? { x: 4, y: 10, fontSize: 8, align: 'left' };
    const stubCheckNumber = settings?.stubCheckNumber ?? { x: 4, y: 18, fontSize: 8, align: 'left' };
    const stubBeneficiary = settings?.stubBeneficiary ?? { x: 4, y: 26, fontSize: 8, align: 'left' };
    const stubAmount = settings?.stubAmount ?? { x: 4, y: 34, fontSize: 8, align: 'left' };
    const micr = settings?.micrLine ?? {
      x: settings?.micrLineX ?? 117.5,
      y: settings?.micrLineY ?? 70,
      fontSize: settings?.micrLineFontSize ?? 14,
      align: settings?.micrLineAlign ?? 'center',
    };

    const dinars = Math.floor(instrument.amount);
    const dirhams = Math.round((instrument.amount - dinars) * 1000);
    const amountFormatted = `${dinars}.${String(dirhams).padStart(3, '0')}`;
    const micrLine = buildMicrLine(instrument.instrumentNo, instrument.routingNumber, instrument.accountingNumber);
    const issue = instrument.issueDate || instrument.bookDate;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>طباعة صك مصدق - ${instrument.instrumentNo}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${checkWidth}mm ${checkHeight}mm; margin: 0; }
    @font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check { position: relative; width: ${checkWidth}mm; height: ${checkHeight}mm; overflow: hidden; }
    .field { position: absolute; white-space: nowrap; color: #000; }
    .account-holder { left:${accountHolder.x}mm; top:${accountHolder.y}mm; font-size:${accountHolder.fontSize}pt; text-align:${accountHolder.align}; font-weight:600; }
    .account-number { left:${accountNumber.x}mm; top:${accountNumber.y}mm; font-size:${accountNumber.fontSize}pt; text-align:${accountNumber.align}; font-family:'Courier New',monospace; direction:ltr; }
    .beneficiary { left:${beneficiary.x}mm; top:${beneficiary.y}mm; font-size:${beneficiary.fontSize}pt; text-align:${beneficiary.align}; font-weight:600; }
    .check-number { left:${checkNumber.x}mm; top:${checkNumber.y}mm; font-size:${checkNumber.fontSize}pt; text-align:${checkNumber.align}; font-family:'Courier New',monospace; font-weight:bold; direction:ltr; }
    .branch-name { left:${branchNamePos.x}mm; top:${branchNamePos.y}mm; font-size:${branchNamePos.fontSize}pt; text-align:${branchNamePos.align}; font-weight:600; transform:${branchNamePos.align === 'center' ? 'translateX(-50%)' : 'none'}; }
    .amount-n { left:${amountNumbers.x}mm; top:${amountNumbers.y}mm; font-size:${amountNumbers.fontSize}pt; text-align:right; font-weight:bold; font-family:'Courier New',monospace; direction:ltr; transform:translateX(-100%); }
    .amount-w { left:${amountWordsPos.x}mm; top:${amountWordsPos.y}mm; font-size:${amountWordsPos.fontSize}pt; text-align:center; max-width:150mm; white-space:normal; transform:translateX(-50%); }
    .issue { left:${issueDate.x}mm; top:${issueDate.y}mm; font-size:${issueDate.fontSize}pt; text-align:${issueDate.align}; }
    .stub-date { left:${stubDate.x}mm; top:${stubDate.y}mm; font-size:${stubDate.fontSize}pt; text-align:${stubDate.align}; }
    .stub-check { left:${stubCheckNumber.x}mm; top:${stubCheckNumber.y}mm; font-size:${stubCheckNumber.fontSize}pt; text-align:${stubCheckNumber.align}; }
    .stub-benef { left:${stubBeneficiary.x}mm; top:${stubBeneficiary.y}mm; font-size:${stubBeneficiary.fontSize}pt; text-align:${stubBeneficiary.align}; max-width:28mm; overflow:hidden; }
    .stub-amount { left:${stubAmount.x}mm; top:${stubAmount.y}mm; font-size:${stubAmount.fontSize}pt; text-align:${stubAmount.align}; direction:ltr; }
    .micr-line { position:absolute; left:${micr.x}mm; top:${micr.y}mm; font-size:${micr.fontSize}pt; text-align:${micr.align}; font-family:'MICR',monospace; letter-spacing:0.15em; direction:ltr; white-space:nowrap; font-weight:bold; transform:${micr.align === 'center' ? 'translateX(-50%)' : 'none'}; }
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
    <div class="field amount-w">${amountWords}</div>
    <div class="micr-line">${micrLine}</div>
  </section>
  <script>window.onload=()=>setTimeout(()=>window.print(),400);</script>
</body>
</html>`;

    setPrinting(true);
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) {
      setError('تعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.');
      setPrinting(false);
      return;
    }
    win.document.write(html);
    win.document.close();
    certifiedInstrumentLogService.create({
      operationType: 'print',
      txnRefNo: instrument.txnRefNo,
      instrumentNo: instrument.instrumentNo,
      accountNumber: instrument.accountNumber,
      accountHolderName: instrument.accountHolderName,
      beneficiaryName: instrument.beneficiaryName,
      amount: instrument.amount,
      currency: instrument.currency,
      issueDate: instrument.issueDate || instrument.bookDate,
      txnBranch: instrument.txnBranch,
      branchId: instrument.branchId ?? null,
      branchName: instrument.branchName,
      routingNumber: instrument.routingNumber,
      accountingNumber: instrument.accountingNumber,
      amountWords,
    }).catch((logError) => {
      console.error('فشل تسجيل طباعة الصك المصدق:', logError);
    });
    setPrinting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
            <Stamp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">طباعة صك مصدق من المنظومة</h1>
            <p className="text-gray-600">الاستعلام برقم العملية ثم طباعة القيمة والمستفيد والتفقيط والترميز</p>
          </div>
        </div>

        <div className="card">
          <form onSubmit={handleQuery} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-600 mb-1">الرقم المرجعي</label>
              <input
                type="text"
                value={txnRefNo}
                onChange={(e) => setTxnRefNo(e.target.value)}
                className="input w-full"
                dir="ltr"
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
              <Search className="w-4 h-4" />
              {loading ? 'جاري الاستعلام...' : 'استعلام'}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {instrument && (
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-3">بيانات الصك</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><span className="text-gray-500">المستفيد: </span><strong>{instrument.beneficiaryName}</strong></p>
              <p><span className="text-gray-500">صاحب الحساب: </span><strong>{instrument.accountHolderName}</strong></p>
              <p><span className="text-gray-500">رقم الحساب: </span><span className="font-mono" dir="ltr">{instrument.accountNumber}</span></p>
              <p><span className="text-gray-500">رقم الصك: </span><span className="font-mono" dir="ltr">{instrument.instrumentNo}</span></p>
              <p><span className="text-gray-500">رقم الفرع (من المصرف): </span><span className="font-mono" dir="ltr">{instrument.txnBranch}</span></p>
              <p><span className="text-gray-500">اسم الفرع: </span><strong>{instrument.branchName || '—'}</strong></p>
              <p><span className="text-gray-500">الرقم التوجيهي: </span><span className="font-mono" dir="ltr">{instrument.routingNumber || '—'}</span></p>
              <p><span className="text-gray-500">الرقم المحاسبي: </span><span className="font-mono" dir="ltr">{instrument.accountingNumber || '—'}</span></p>
              <p><span className="text-gray-500">التاريخ: </span>{instrument.issueDate}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">القيمة بالأرقام</label>
                <input
                  type="text"
                  readOnly
                  className="input w-full bg-gray-50 font-mono"
                  dir="ltr"
                  value={`${instrument.amount} ${instrument.currency || 'LYD'}`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">التفقيط (القيمة بالحروف)</label>
                <textarea
                  className="input w-full min-h-[72px]"
                  value={amountWords}
                  onChange={(e) => setAmountWords(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">تُملأ تلقائياً من القيمة ويمكن تعديلها قبل الطباعة</p>
              </div>
            </div>

            <div className="bg-gray-50 border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">سطر الترميز الذي سيُطبع أسفل الشيك</p>
              <style>{`@font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }`}</style>
              <p
                className="text-center py-2"
                dir="ltr"
                style={{
                  fontFamily: 'MICR, monospace',
                  fontSize: '14pt',
                  letterSpacing: '0.15em',
                  fontWeight: 'bold',
                }}
              >
                {buildMicrLine(instrument.instrumentNo, instrument.routingNumber, instrument.accountingNumber)}
              </p>
              <p className="text-xs text-gray-500 font-mono text-center" dir="ltr">
                {buildMicrLine(instrument.instrumentNo, instrument.routingNumber, instrument.accountingNumber)}
              </p>
            </div>

            <button
              onClick={handlePrint}
              disabled={printing || !instrument.routingNumber || !instrument.accountingNumber}
              className="btn btn-primary flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة الصك وترميزه
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
