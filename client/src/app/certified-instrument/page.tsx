'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, Stamp, AlertCircle } from 'lucide-react';
import { soapService, certifiedCheckService, certifiedInstrumentLogService, type SoapInstrumentResponse } from '@/lib/api';
import { amountToArabicTafqeet } from '@/lib/utils/arabicAmountWords';
import { buildMicrLine, openCertifiedInstrumentPrint } from '@/lib/utils/certifiedInstrumentPrint';

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
      if (result.alreadyPrinted) {
        setError('هذا الصك مطبوع مسبقاً. يمكن إعادة طباعته من سجل طباعة الصك المصدق فقط.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.details || err?.response?.data?.error || err.message || 'فشل الاستعلام عن الصك المصدق');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!instrument) return;

    if (instrument.alreadyPrinted) {
      setError('هذا الصك مطبوع مسبقاً. يمكن إعادة طباعته من سجل طباعة الصك المصدق فقط.');
      return;
    }

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

    setPrinting(true);
    setError(null);
    try {
      await certifiedInstrumentLogService.create({
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
      });

      const opened = openCertifiedInstrumentPrint(
        {
          ...instrument,
          issueDate: instrument.issueDate || instrument.bookDate,
        },
        amountWords,
        settings
      );
      if (!opened) {
        setError('تم تسجيل الطباعة وتعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم أعد الطباعة من السجل.');
      }
      setInstrument({ ...instrument, alreadyPrinted: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'فشل تسجيل الطباعة');
      if (err?.response?.data?.alreadyPrinted) {
        setInstrument({ ...instrument, alreadyPrinted: true });
      }
    } finally {
      setPrinting(false);
    }
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
              disabled={printing || instrument.alreadyPrinted || !instrument.routingNumber || !instrument.accountingNumber}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {instrument.alreadyPrinted ? 'مطبوع — أعد الطباعة من السجل' : 'طباعة الصك وترميزه'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
