'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Printer, CheckCircle, RefreshCw } from 'lucide-react';
import renderCheckbookHtml, { type CheckbookData } from '@/lib/utils/printRenderer';
import {
  buildPreviewFromSoap,
  type SoapCheckbookResponse,
} from '@/lib/soap/checkbook';
import { printSettingsAPI, type PrintSettings } from '@/lib/printSettings.api';
import { branchService, soapService, printLogService } from '@/lib/api';
import { resolveAccountType } from '@/lib/utils/accountType';
import { useAppSelector } from '@/store/hooks';
import { assertClientSameBranch } from '@/lib/utils/branchAccess';

export default function PrintPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
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
  const [alreadyPrintedCheques, setAlreadyPrintedCheques] = useState<number[]>([]);
  /** true بعد تسجيل الطباعة وخصم المخزون — يسمح بإعادة فتح نافذة الطباعة فقط */
  const [printLogged, setPrintLogged] = useState(false);

  const openPrintWindow = (preview: CheckbookData) => {
    const htmlContent = renderCheckbookHtml(preview);
    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      throw new Error('تعذّر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber) return;

    setLoading(true);
    setError(null);
    setSuccess(false);
    setPrintLogged(false);
    setSoapData(null);
    setCheckbookPreview(null);
    setBranchInfo(null);
    setLayout(null);
    setAlreadyPrintedCheques([]);

    try {
      // الحصول على معلومات المستخدم الحالي
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const branchError = assertClientSameBranch(currentUser, accountNumber.substring(0, 3));
      if (branchError) {
        setError(branchError);
        setLoading(false);
        return;
      }

      // استخدام الخدمة الجديدة التي تمر عبر الخادم
      // رقم الفرع سيتم استخراجه تلقائياً من أول 3 أرقام من رقم الحساب في الخادم
      const soapResponse = await soapService.queryCheckbook({
        accountNumber,
        firstChequeNumber: firstChequeNumber ? parseInt(firstChequeNumber, 10) : undefined,
      }) as SoapCheckbookResponse;

      const accountType = soapResponse.customerCategoryFound && soapResponse.accountType
        ? (soapResponse.accountType as 1 | 2)
        : resolveAccountType({
            chequeLeaves: soapResponse.chequeLeaves,
            chequeCount: soapResponse.chequeStatuses?.filter((c) => c.chequeNumber > 0).length,
          });

      if (soapResponse.categoryLeavesMismatch) {
        setError(soapResponse.categoryLeavesMismatchError || 'تعارض بين فئة الحساب وعدد أوراق الدفتر. لا يمكن الطباعة.');
      } else if (!soapResponse.customerCategoryFound) {
        setError(soapResponse.customerCategoryError || 'تعذر تحديد فئة الحساب من عدادات الفئات. سجّل الفئة قبل الطباعة.');
      }

      let resolvedLayout: PrintSettings | null = null;
      try {
        resolvedLayout = await printSettingsAPI.getSettings(accountType);
        setLayout(resolvedLayout);
      } catch (layoutError) {
        console.warn('تعذر تحميل إعدادات الطباعة المخصصة، سيتم استخدام القيم الافتراضية.', layoutError);
      }

      // استخراج رمز الفرع من أول 3 أرقام من رقم الحساب (كما طلب المستخدم)
      // سيتم استخدام الدالة الجديدة في الـ Backend التي تقوم بهذا تلقائياً

      let resolvedBranchName = soapResponse.branchName;
      let resolvedRouting = soapResponse.routingNumber;

      // استخدام الدالة الجديدة من الـ Backend لجلب بيانات الفرع بناءً على رقم الحساب
      if (!resolvedBranchName || !resolvedRouting || resolvedBranchName.startsWith('فرع 0')) {
        try {
          console.log(`🔍 جلب بيانات الفرع من الـ Backend لرقم الحساب: ${accountNumber}`);
          const branch = await branchService.getByAccountNumber(accountNumber);
          if (branch) {
            resolvedBranchName = branch.branchName;
            resolvedRouting = branch.routingNumber;
            console.log('✅ تم العثور على الفرع:', branch);
          } else {
            console.warn('⚠️ لم يتم العثور على الفرع في قاعدة البيانات');
          }
        } catch (branchError) {
          console.warn('تعذر العثور على بيانات الفرع:', branchError);
        }
      }

      // قيم افتراضية في حال الفشل التام
      resolvedBranchName = resolvedBranchName || `فرع ${soapResponse.accountBranch}`;
      resolvedRouting = resolvedRouting || soapResponse.accountBranch;

      setBranchInfo({ name: resolvedBranchName, routing: resolvedRouting });

      // تحذير إذا لم يتم العثور على بيانات الفرع الحقيقية
      if (resolvedRouting === soapResponse.accountBranch || resolvedBranchName.startsWith('فرع 0')) {
        setError('⚠️ تنبيه: لم يتم العثور على بيانات الفرع (الاسم والرقم التوجيهي) في قاعدة البيانات. سيتم استخدام القيم الافتراضية (رقم الفرع) وهذا قد يؤدي لطباعة خط MICR غير صحيح. يرجى إضافة الفرع في صفحة "إدارة الفروع".');
      }

      // التحقق من الشيكات المطبوعة مسبقاً من قاعدة البيانات المحلية
      const chequeNumbers = soapResponse.chequeStatuses.map(s => s.chequeNumber);
      try {
        const printStatus = await printLogService.checkStatus(accountNumber, chequeNumbers);
        const printed = printStatus
          .filter(s => s.isPrinted && !s.canReprint)
          .map(s => s.chequeNumber);

        if (printed.length > 0) {
          setAlreadyPrintedCheques(printed);
          setError('⚠️ تنبيه: هذا الدفتر (أو بعض شيكاته) تمت طباعته مسبقاً. لا يمكن إعادة الطباعة من هنا، يرجى مراجعة سجلات الطباعة.');

          // تحديث حالة الشيكات في العرض لتظهر كمطبوعة
          soapResponse.chequeStatuses = soapResponse.chequeStatuses.map(s => {
            if (printed.includes(s.chequeNumber)) {
              return { ...s, status: 'U' };
            }
            return s;
          });
        } else {
          setAlreadyPrintedCheques([]);
        }
      } catch (checkError) {
        console.warn('تعذر التحقق من حالة الطباعة:', checkError);
      }

      setSoapData(soapResponse);
      if (soapResponse.categoryLeavesMismatch) {
        setCheckbookPreview(null);
        setError(soapResponse.categoryLeavesMismatchError || 'تعارض بين فئة الحساب وعدد أوراق الدفتر. لا يمكن الطباعة.');
        return;
      }
      const preview = buildPreviewFromSoap(soapResponse, {
        layout: resolvedLayout ?? undefined,
        branchName: resolvedBranchName,
        routingNumber: resolvedRouting,
        accountType,
      });
      setCheckbookPreview(preview);
      if (!soapResponse.customerCategoryFound) {
        setError((prev) =>
          prev && prev.startsWith('⚠️')
            ? prev
            : (soapResponse.customerCategoryError || 'فئة الحساب غير مسجلة في عدادات الفئات')
        );
      }
    } catch (err: any) {
      console.error('SOAP query failed:', err);
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.details ||
          err.message ||
          'فشل الاستعلام عن دفتر الشيكات عبر SOAP'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!checkbookPreview || !soapData) {
      setError('لا توجد بيانات جاهزة للطباعة. الرجاء إجراء الاستعلام أولاً.');
      return;
    }

    if (soapData.categoryLeavesMismatch) {
      setError(soapData.categoryLeavesMismatchError || 'تعارض بين فئة الحساب وعدد أوراق الدفتر. لا يمكن الطباعة.');
      return;
    }

    if (!soapData.customerCategoryFound) {
      setError(soapData.customerCategoryError || 'لا يمكن الطباعة قبل تسجيل فئة الحساب في عدادات الفئات.');
      return;
    }

    // دفتر مطبوع مسبقاً من استعلام سابق → إعادة الطباعة من السجلات فقط
    if (alreadyPrintedCheques.length > 0 && !printLogged) {
      setError('لا يمكن الطباعة! بعض الشيكات تم طباعتها مسبقاً. يمكنك إعادة الطباعة فقط من شاشة السجلات.');
      return;
    }

    setPrinting(true);
    setError(null);

    try {
      // بعد التسجيل الأول: إعادة فتح نافذة الطباعة فقط بدون خصم مخزون جديد
      if (printLogged) {
        openPrintWindow(checkbookPreview);
        setSuccess(true);
        return;
      }

      // تسجيل + خصم مخزون قبل فتح الطباعة لأول مرة
      const chequeNumbers = soapData.chequeStatuses.map(s => s.chequeNumber);
      await printLogService.create({
        accountNumber: soapData.accountNumber,
        accountBranch: soapData.accountBranch,
        branchName: branchInfo?.name,
        firstChequeNumber: Math.min(...chequeNumbers),
        lastChequeNumber: Math.max(...chequeNumbers),
        totalCheques: chequeNumbers.length,
        accountType: checkbookPreview.operation.accountType,
        operationType: 'print',
        chequeNumbers,
        customerName: soapData.customerName,
      });

      setPrintLogged(true);
      setSoapData(prev => prev ? ({
        ...prev,
        chequeStatuses: prev.chequeStatuses.map(s => ({
          ...s,
          status: 'U'
        }))
      }) : null);

      openPrintWindow(checkbookPreview);
      setSuccess(true);
    } catch (err: any) {
      console.error('Print failed:', err);
      const message =
        err?.response?.data?.details ||
        err?.response?.data?.error ||
        err?.message ||
        'فشل إنشاء صفحة الطباعة أو خصم المخزون';
      setError(message);
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
              <label className="block text-sm text-gray-600 mb-1">أول رقم شيك </label>
              <input
                type="number"
                value={firstChequeNumber}
                onChange={(e) => setFirstChequeNumber(e.target.value)}
                placeholder=""
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
                    جاري الاتصال...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    استعلام
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`px-4 py-3 rounded-lg ${
            soapData?.categoryLeavesMismatch
              ? 'bg-red-100 border-2 border-red-400 text-red-900'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {soapData?.categoryLeavesMismatch && (
              <p className="font-bold mb-1">تم إيقاف الطباعة</p>
            )}
            <p>{error}</p>
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
              تم فتح صفحة الطباعة في نافذة جديدة. يمكنك الضغط على الزر مرة أخرى لإعادة فتح الطباعة دون خصم جديد من المخزون.
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
              <div className="space-y-6">
                {/* Account Summary Card */}
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Account Number & Name */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">الحساب</p>
                      <p className="text-2xl font-bold text-gray-800 font-mono tracking-tight">
                        {soapData.accountNumber}
                      </p>
                      <p className="text-sm font-medium text-gray-600">
                        {soapData.customerName || 'غير متوفر'}
                      </p>
                    </div>

                    {/* Branch Info */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">الفرع</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {soapData.accountBranch} {branchInfo && `- ${branchInfo.name}`}
                      </p>
                      {branchInfo && (
                        <p className="text-xs text-gray-500 font-mono">
                          Route: {branchInfo.routing}
                        </p>
                      )}
                    </div>

                    {/* Checkbook Status */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">تفاصيل الدفتر</p>
                      <div className="flex flex-wrap gap-2 text-sm">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium border border-blue-100">
                          {soapData.chequeLeaves} ورقة
                        </span>
                        <span className={`px-2 py-1 rounded-md font-medium border ${
                          soapData.micrTypeCode === '02'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                            : 'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          ترميز {soapData.micrTypeCode || '—'} — {soapData.micrTypeCode === '02' ? 'شركات' : soapData.micrTypeCode === '01' ? 'أفراد' : 'غير محدد'}
                        </span>
                        {soapData.customerCategoryCode && (
                          <span className="bg-gray-50 text-gray-700 px-2 py-1 rounded-md font-medium border border-gray-200 font-mono">
                            فئة {soapData.customerCategoryCode}
                          </span>
                        )}
                      </div>
                      {soapData.customerCategoryDescription && (
                        <p className="text-xs text-gray-500 mt-1">{soapData.customerCategoryDescription}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Start: <span className="font-mono text-gray-600">{soapData.firstChequeNumber ?? 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Checks Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-700">قائمة الشيكات ({soapData.chequeStatuses.length})</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {soapData.chequeStatuses.map((status) => (
                      <div
                        key={status.chequeNumber}
                        className={`relative p-3 rounded-lg border transition-all hover:shadow-md ${status.status === 'U'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-white border-gray-200'
                          }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status.status === 'U'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                            }`}>
                            {status.status === 'U' ? 'مطبوع' : 'جديد'}
                          </span>
                          <Printer className={`w-3 h-3 ${status.status === 'U' ? 'text-amber-400' : 'text-gray-300'}`} />
                        </div>

                        <div className="text-center">
                          <p className="text-lg font-bold font-mono text-gray-800 tracking-tight">
                            {status.chequeNumber}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            Book: {status.chequeBookNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-6">
                  <button
                    onClick={handlePrint}
                    disabled={
                      printing ||
                      !checkbookPreview ||
                      !soapData.customerCategoryFound ||
                      !!soapData.categoryLeavesMismatch ||
                      (alreadyPrintedCheques.length > 0 && !printLogged)
                    }
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
                        {printLogged ? 'إعادة فتح الطباعة' : 'طباعة دفتر الشيكات'}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-2">
                    {alreadyPrintedCheques.length > 0 && !printLogged
                      ? 'هذا الدفتر مطبوع مسبقاً — استخدم شاشة سجلات الطباعة لإعادة الطباعة'
                      : printLogged
                        ? 'تمت إضافة السجل وخصم المخزون — الضغط مجدداً يعيد فتح نافذة الطباعة فقط'
                        : 'سيتم استخدام البيانات المستلمة من FLEXCUBE المباشرة للطباعة'}
                  </p>
                  <button
                    onClick={() => {
                      if (!soapData) return;
                      const refreshed = buildPreviewFromSoap(soapData, {
                        layout: layout ?? undefined,
                        branchName: branchInfo?.name,
                        routingNumber: branchInfo?.routing,
                        accountType: soapData.accountType as 1 | 2 | 3 | undefined,
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
          </div>
        )}

        {/* Instructions */}
        {!soapData && !error && (
          <div className="card bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">
              تعليمات الاستعلام:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>ضع رقم الحساب و رقم بداية الطباعة لدفتر الشيكات الذي تم طلبه عبر المنظومة المصرفية</li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

