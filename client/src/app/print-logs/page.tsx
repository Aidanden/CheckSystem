'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printLogService, soapService, branchService } from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { FileText, Printer, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import renderCheckbookHtml, { type CheckbookData } from '@/lib/utils/printRenderer';
import { buildPreviewFromSoap, type SoapCheckbookResponse } from '@/lib/soap/checkbook';
import { printSettingsAPI, type PrintSettings } from '@/lib/printSettings.api';

interface PrintLog {
  id: number;
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  firstChequeNumber: number;
  lastChequeNumber: number;
  totalCheques: number;
  accountType: number;
  operationType: string;
  printedBy: number;
  printedByName: string;
  printDate: string;
  notes?: string;
}

export default function PrintLogsPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [reprinting, setReprinting] = useState(false);

  // Filters
  const [operationType, setOperationType] = useState<'all' | 'print' | 'reprint'>('all');
  const [accountNumber, setAccountNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // التحقق من صلاحية إعادة الطباعة
  const canReprint = currentUser?.isAdmin || currentUser?.permissions?.some(p => p.permissionCode === 'REPRINT');

  useEffect(() => {
    loadLogs();
  }, [page, operationType]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };

      if (operationType !== 'all') {
        params.operationType = operationType;
      }

      if (searchTerm) {
        params.accountNumber = searchTerm;
      }

      const result = await printLogService.getAll(params);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load print logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchTerm(accountNumber);
    setPage(1);
    loadLogs();
  };

  const resolveAccountType = (data: SoapCheckbookResponse): 1 | 2 | 3 => {
    if (data.chequeLeaves === 10) return 3;
    if (data.chequeLeaves === 25) return 1;
    if (data.chequeLeaves === 50) return 2;
    return data.accountNumber.startsWith('2') ? 2 : 1;
  };

  const handleReprint = async (log: PrintLog) => {
    if (!canReprint) {
      alert('ليس لديك صلاحية إعادة الطباعة. يرجى التواصل مع المسؤول.');
      return;
    }

    if (!confirm(`هل أنت متأكد من إعادة طباعة دفتر الشيكات؟\n\nرقم الحساب: ${log.accountNumber}\nنطاق الشيكات: ${log.firstChequeNumber} - ${log.lastChequeNumber}`)) {
      return;
    }

    setReprinting(true);

    try {
      // جلب البيانات من SOAP
      const soapResponse = await soapService.queryCheckbook({
        accountNumber: log.accountNumber,
        firstChequeNumber: log.firstChequeNumber,
      }) as SoapCheckbookResponse;

      const accountType = resolveAccountType(soapResponse);

      // جلب إعدادات الطباعة
      let resolvedLayout: PrintSettings | null = null;
      try {
        resolvedLayout = await printSettingsAPI.getSettings(accountType);
      } catch (layoutError) {
        console.warn('تعذر تحميل إعدادات الطباعة المخصصة، سيتم استخدام القيم الافتراضية.', layoutError);
      }

      // استخدام الدالة الجديدة من الـ Backend لجلب بيانات الفرع بناءً على رقم الحساب

      let resolvedBranchName = soapResponse.branchName || log.branchName;
      let resolvedRouting = soapResponse.routingNumber;

      if (!resolvedBranchName || !resolvedRouting || resolvedBranchName.startsWith('فرع 0')) {
        try {
          const branch = await branchService.getByAccountNumber(log.accountNumber);
          if (branch) {
            resolvedBranchName = branch.branchName;
            resolvedRouting = branch.routingNumber;
          }
        } catch (branchError) {
          console.warn('تعذر العثور على بيانات الفرع:', branchError);
        }
      }

      // قيم افتراضية
      resolvedBranchName = resolvedBranchName || `فرع ${soapResponse.accountBranch}`;
      resolvedRouting = resolvedRouting || soapResponse.accountBranch;

      // تحذير إذا لم يتم العثور على بيانات الفرع الحقيقية
      if (resolvedRouting === soapResponse.accountBranch || resolvedBranchName.startsWith('فرع 0')) {
        alert('⚠️ تنبيه: لم يتم العثور على بيانات الفرع (الاسم والرقم التوجيهي) في قاعدة البيانات. سيتم استخدام القيم الافتراضية وهذا قد يؤدي لطباعة خط MICR غير صحيح.');
      }

      // بناء معاينة الطباعة
      const preview = buildPreviewFromSoap(soapResponse, {
        layout: resolvedLayout ?? undefined,
        branchName: resolvedBranchName,
        routingNumber: resolvedRouting,
      });

      // طباعة
      const htmlContent = renderCheckbookHtml(preview);
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

      // تسجيل عملية إعادة الطباعة
      try {
        const chequeNumbers = soapResponse.chequeStatuses.map(s => s.chequeNumber);
        await printLogService.create({
          accountNumber: soapResponse.accountNumber,
          accountBranch: soapResponse.accountBranch,
          branchName: resolvedBranchName,
          firstChequeNumber: Math.min(...chequeNumbers),
          lastChequeNumber: Math.max(...chequeNumbers),
          totalCheques: chequeNumbers.length,
          accountType: preview.operation.accountType,
          operationType: 'reprint',
          chequeNumbers,
        });
        console.log('✅ تم تسجيل عملية إعادة الطباعة بنجاح');

        // إعادة تحميل السجلات
        loadLogs();
      } catch (logError) {
        console.error('فشل تسجيل عملية إعادة الطباعة:', logError);
      }

      alert('✅ تمت إعادة الطباعة بنجاح!');
    } catch (error: any) {
      console.error('Reprint failed:', error);
      alert(`فشل في إعادة الطباعة: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setReprinting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ar-LY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperationTypeLabel = (type: string) => {
    return type === 'print' ? 'طباعة' : 'إعادة طباعة';
  };

  const getOperationTypeBadge = (type: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    if (type === 'print') {
      return `${baseClasses} bg-green-100 text-green-800`;
    }
    return `${baseClasses} bg-blue-100 text-blue-800`;
  };

  if (loading && logs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">سجلات الطباعة</h1>
              <p className="text-sm text-gray-600">عرض ومراقبة جميع عمليات الطباعة وإعادة الطباعة</p>
            </div>
          </div>
        </div>

        {/* Permission Notice */}
        {!canReprint && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
            <p className="text-sm font-medium">
              ⚠️ ليس لديك صلاحية إعادة الطباعة. يمكنك فقط عرض السجلات.
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search by Account Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                البحث برقم الحساب
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="أدخل رقم الحساب..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSearch}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  بحث
                </button>
              </div>
            </div>

            {/* Filter by Operation Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع العملية
              </label>
              <select
                value={operationType}
                onChange={(e) => {
                  setOperationType(e.target.value as any);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">الكل</option>
                <option value="print">طباعة</option>
                <option value="reprint">إعادة طباعة</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي السجلات</p>
                <p className="text-2xl font-bold text-gray-800">{total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الحساب
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الفرع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نطاق الشيكات
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    العدد
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    نوع العملية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستخدم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.accountNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.branchName || `فرع ${log.accountBranch}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {log.firstChequeNumber} - {log.lastChequeNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.totalCheques}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getOperationTypeBadge(log.operationType)}>
                        {getOperationTypeLabel(log.operationType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.printedByName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(log.printDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {canReprint && (
                        <button
                          onClick={() => handleReprint(log)}
                          disabled={reprinting}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="إعادة الطباعة"
                        >
                          <Printer className="w-4 h-4" />
                          {reprinting ? 'جاري...' : 'إعادة طباعة'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                عرض {(page - 1) * limit + 1} إلى {Math.min(page * limit, total)} من {total} سجل
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 rounded ${page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {logs.length === 0 && !loading && (
          <div className="card text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سجلات</h3>
            <p className="text-gray-600">لم يتم العثور على أي سجلات طباعة</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
