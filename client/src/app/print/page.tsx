'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, CheckCircle, RefreshCw } from 'lucide-react';
import renderCheckbookHtml, { type CheckbookData } from '@/lib/utils/printRenderer';
import {
  querySoapCheckbook,
  buildPreviewFromSoap,
  type SoapCheckbookResponse,
} from '@/lib/soap/checkbook';
import { printSettingsAPI, type PrintSettings } from '@/lib/printSettings.api';
import { branchService, soapService } from '@/lib/api';

export default function PrintPage() {
  const [accountNumber, setAccountNumber] = useState('');
  const [firstChequeNumber, setFirstChequeNumber] = useState('');
  const [soapData, setSoapData] = useState<SoapCheckbookResponse | null>(null);
  const [checkbookPreview, setCheckbookPreview] = useState<CheckbookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchInfo, setBranchInfo] = useState<{ name: string; routing: string } | null>(null);
  const [layout, setLayout] = useState<PrintSettings | null>(null);

  const resolveAccountType = (data: SoapCheckbookResponse): 1 | 2 | 3 => {
    if (data.chequeLeaves === 10) return 3;
    if (data.chequeLeaves === 25) return 1;
    if (data.chequeLeaves === 50) return 2;
    return data.accountNumber.startsWith('2') ? 2 : 1;
  };


  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setSoapData(null);
    setCheckbookPreview(null);
    setBranchInfo(null);
    setLayout(null);

    try {
      // استخدام الخدمة الجديدة التي تمر عبر الخادم
      // رقم الفرع سيتم استخراجه تلقائياً من أول 3 أرقام من رقم الحساب في الخادم
      const soapResponse = await soapService.queryCheckbook({
        accountNumber,
        firstChequeNumber: firstChequeNumber ? parseInt(firstChequeNumber, 10) : undefined,
      }) as SoapCheckbookResponse;

      const accountType = resolveAccountType(soapResponse);

      let resolvedLayout: PrintSettings | null = null;
      try {
        resolvedLayout = await printSettingsAPI.getSettings(accountType);
        setLayout(resolvedLayout);
      } catch (layoutError) {
        console.warn('تعذر تحميل إعدادات الطباعة المخصصة، سيتم استخدام القيم الافتراضية.', layoutError);
      }

      // استخدام معلومات الفرع من استجابة SOAP إذا كانت موجودة
      let resolvedBranchName = soapResponse.branchName || `فرع ${soapResponse.accountBranch}`;
      let resolvedRouting = soapResponse.routingNumber || soapResponse.accountBranch;
      
      // إذا لم تكن معلومات الفرع موجودة في الاستجابة، نحاول جلبها من الخدمة
      if (!soapResponse.branchName || !soapResponse.routingNumber) {
        try {
          const branch = await branchService.getByCode(soapResponse.accountBranch);
          if (branch) {
            resolvedBranchName = branch.branchName;
            resolvedRouting = branch.routingNumber;
          }
        } catch (branchError) {
          console.warn('تعذر العثور على بيانات الفرع، سيتم استخدام البيانات المتاحة.', branchError);
        }
      }
      
      setBranchInfo({ name: resolvedBranchName, routing: resolvedRouting });

      const preview = buildPreviewFromSoap(soapResponse, {
        layout: resolvedLayout ?? undefined,
        branchName: resolvedBranchName,
        routingNumber: resolvedRouting,
      });
      setSoapData(soapResponse);
      setCheckbookPreview(preview);
    } catch (err: any) {
      console.error('SOAP query failed:', err);
      setError(err.message || 'فشل الاستعلام عن دفتر الشيكات عبر SOAP');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!checkbookPreview) {
      setError('لا توجد بيانات جاهزة للطباعة. الرجاء إجراء الاستعلام أولاً.');
      return;
    }

    setPrinting(true);
    setError(null);
    setSuccess(false);

    try {
      const htmlContent = renderCheckbookHtml(checkbookPreview);
      const printWindow = window.open('', '_blank', 'width=1024,height=768');
      if (!printWindow) {
        throw new Error('تعذّر فتح نافذة الطباعة');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);

      setSuccess(true);
    } catch (err: any) {
      console.error('Print failed:', err);
      setError(err.message || 'فشل إنشاء صفحة الطباعة');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">طباعة شيك جديد</h1>

        {/* Search Form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            الاستعلام عن حساب
          </h2>

          <form onSubmit={handleQuery} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-600 mb-1">رقم الحساب</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="أدخل رقم الحساب"
                className="input w-full"
                disabled={loading}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm text-gray-600 mb-1">أول رقم شيك (اختياري)</label>
              <input
                type="number"
                value={firstChequeNumber}
                onChange={(e) => setFirstChequeNumber(e.target.value)}
                placeholder="734"
                className="input w-full"
                disabled={loading}
                min={0}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading || !accountNumber}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري الاتصال بالـ SOAP...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    استعلام SOAP
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">تمت الطباعة بنجاح!</span>
            </div>
            <p className="text-sm text-green-600">
              تم فتح صفحة الطباعة في نافذة جديدة. سيتم بدء الطباعة تلقائياً.
            </p>
          </div>
        )}

        {/* Account Details */}
        {soapData && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              بيانات الحساب
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">رقم الحساب</p>
                  <p className="font-mono font-semibold text-gray-800 mt-1">
                    {soapData.accountNumber}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">رمز الفرع</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.accountBranch}
                  </p>
                </div>
                {branchInfo && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">اسم الفرع</p>
                      <p className="font-semibold text-gray-800 mt-1">{branchInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">الرقم التوجيهي</p>
                      <p className="font-mono font-semibold text-gray-800 mt-1">
                        {branchInfo.routing}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-sm text-gray-600">أول رقم شيك</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.firstChequeNumber ?? 'غير محدد'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">عدد الأوراق</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.chequeLeaves ?? 0}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">حالة الطلب</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.requestStatus ?? 'غير متوفر'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">نوع دفتر الشيكات</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.checkBookType ?? 'غير متوفر'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">طريقة التسليم</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.deliveryMode ?? 'غير متوفر'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">آخر تعديل</p>
                  <p className="font-semibold text-gray-800 mt-1">
                    {soapData.checkerStamp ?? soapData.makerStamp ?? 'غير متوفر'}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-right text-gray-600">رقم الشيك</th>
                      <th className="px-3 py-2 text-right text-gray-600">رقم الدفتر</th>
                      <th className="px-3 py-2 text-right text-gray-600">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {soapData.chequeStatuses.map((status) => (
                      <tr key={status.chequeNumber}>
                        <td className="px-3 py-2 font-mono">{status.chequeNumber}</td>
                        <td className="px-3 py-2">{status.chequeBookNumber}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.status === 'U'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                          }`}>
                            {status.status === 'U' ? 'مطبوع' : 'جديد'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <button
                  onClick={handlePrint}
                  disabled={printing || !checkbookPreview}
                  className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-3"
                >
                  {printing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري الطباعة...
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      طباعة دفتر الشيكات (SOAP)
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center mt-2">
                  سيتم استخدام البيانات المستلمة من واجهة SOAP المباشرة للطباعة
                </p>
                <button
                  onClick={() => {
                    if (!soapData) return;
                    const refreshed = buildPreviewFromSoap(soapData, {
                      layout: layout ?? undefined,
                      branchName: branchInfo?.name,
                      routingNumber: branchInfo?.routing,
                    });
                    setCheckbookPreview(refreshed);
                  }}
                  className="mt-3 w-full btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2"
                  disabled={!soapData}
                >
                  <RefreshCw className="w-4 h-4" />
                  إعادة تحميل المعاينة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!soapData && !error && (
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              تعليمات الطباعة:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>أدخل رقم الحساب المصرفي للاستعلام</li>
              <li>سيتم جلب البيانات مباشرة من واجهة SOAP</li>
              <li>تأكد من تشغيل الخادم التجريبي على المنفذ 8080</li>
              <li>يمكن تعديل رقم الشيك الأول عند الحاجة</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

