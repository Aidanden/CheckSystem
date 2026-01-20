'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedCheckService } from '@/lib/api';
import { CertifiedCheckLog, CertifiedBranch } from '@/lib/api/services/certifiedCheck.service';
import { useAppSelector } from '@/store/hooks';
import { ClipboardList, Printer, RefreshCw, Eye, Building2, Calendar, X } from 'lucide-react';

export default function CertifiedLogsPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [logs, setLogs] = useState<CertifiedCheckLog[]>([]);
    const [branches, setBranches] = useState<CertifiedBranch[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reprinting, setReprinting] = useState(false);
    const [page, setPage] = useState(0);
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
    const pageSize = 10;

    // Reprint Modal State
    const [reprintModalOpen, setReprintModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<CertifiedCheckLog | null>(null);
    const [reprintStartSerial, setReprintStartSerial] = useState<number>(0);
    const [reprintEndSerial, setReprintEndSerial] = useState<number>(0);
    const [reprintReason, setReprintReason] = useState<'damaged' | 'not_printed' | ''>('');

    // التحقق من صلاحية إعادة الطباعة
    const canReprint = user?.isAdmin || user?.permissions?.some(p => p.permissionCode === 'REPRINT_CERTIFIED');

    useEffect(() => {
        loadBranches();
    }, []);

    useEffect(() => {
        loadLogs();
    }, [page, selectedBranch]);

    const loadBranches = async () => {
        try {
            const data = await certifiedCheckService.getBranches();
            setBranches(data);
        } catch (err) {
            console.error('Error loading branches:', err);
        }
    };

    const loadLogs = async () => {
        try {
            setLoading(true);
            const result = await certifiedCheckService.getLogs({
                skip: page * pageSize,
                take: pageSize,
                branchId: selectedBranch,
            });
            console.log('✅ Loaded logs result:', result); // Debug log
            if (result && result.logs) {
                setLogs(result.logs);
                setTotal(result.total || 0);
            } else {
                console.warn('⚠️ Unexpected response format:', result);
                setLogs([]);
                setTotal(0);
            }
        } catch (err: any) {
            console.error('❌ Error loading logs:', err);
            // Don't show alert for empty results, only for actual errors
            if (err.response?.status !== 200) {
                console.error('API Error:', err.response?.data || err.message);
            }
            setLogs([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    const openReprintModal = (log: CertifiedCheckLog) => {
        if (!canReprint) {
            alert('ليس لديك صلاحية إعادة الطباعة. يرجى التواصل مع المسؤول.');
            return;
        }
        setSelectedLog(log);
        setReprintStartSerial(log.firstSerial);
        setReprintEndSerial(log.lastSerial);
        setReprintReason(''); // إعادة تعيين السبب
        setReprintModalOpen(true);
    };

    const handleConfirmReprint = async () => {
        if (!selectedLog) return;

        // Validation
        if (reprintStartSerial < selectedLog.firstSerial || reprintEndSerial > selectedLog.lastSerial) {
            alert(`الرجاء اختيار نطاق ضمن النطاق الأصلي (${selectedLog.firstSerial} - ${selectedLog.lastSerial})`);
            return;
        }

        if (reprintStartSerial > reprintEndSerial) {
            alert('رقم البداية يجب أن يكون أصغر من أو يساوي رقم النهاية');
            return;
        }

        // التحقق من اختيار سبب إعادة الطباعة
        if (!reprintReason || (reprintReason !== 'damaged' && reprintReason !== 'not_printed')) {
            alert('الرجاء اختيار سبب إعادة الطباعة: ورقة تالفة أو ورقة لم تطبع');
            return;
        }

        setReprinting(true);

        try {
            // إنشاء بيانات الطباعة من السجل المحدد
            const printData = {
                branchId: selectedLog.branchId,
                branchName: selectedLog.branchName,
                accountingNumber: selectedLog.accountingNumber,
                routingNumber: selectedLog.routingNumber,
                firstSerial: reprintStartSerial,
                lastSerial: reprintEndSerial,
                checksCount: reprintEndSerial - reprintStartSerial + 1,
            };

            // طباعة مباشرة (نفس آلية الأفراد والشركات)
            openPrintWindow(printData);

            // تسجيل عملية إعادة الطباعة
            try {
                const result = await certifiedCheckService.reprintBook(selectedLog.id, {
                    firstSerial: reprintStartSerial,
                    lastSerial: reprintEndSerial,
                    reprintReason: reprintReason as 'damaged' | 'not_printed',
                });

                if (result.success) {
                    console.log('✅ تم تسجيل عملية إعادة الطباعة بنجاح');
                    loadLogs(); // Refresh logs
                }
            } catch (logError: any) {
                console.error('فشل تسجيل عملية إعادة الطباعة:', logError);
                alert(logError.response?.data?.error || logError.message || 'فشل تسجيل عملية إعادة الطباعة');
                return;
            }

            setReprintModalOpen(false);
            setReprintReason(''); // إعادة تعيين السبب
        } catch (err: any) {
            console.error('Error reprinting:', err);
            alert(err.response?.data?.error || 'فشل في إعادة الطباعة');
        } finally {
            setReprinting(false);
        }
    };

    const openPrintWindow = (printData: any) => {
        // رقم الترميز: من اليمين لليسار = 03 + محاسبي + توجيهي + تسلسلي
        // في MICR (من اليسار لليمين): C{serial}C A{routing}A {accounting}C 03
        const buildMicrLine = (serial: number) => {
            const serialStr = String(serial).padStart(9, '0');
            const accountingStr = String(printData.accountingNumber || '').padStart(10, '0');
            const routingStr = String(printData.routingNumber || '').padStart(8, '0');
            return `C${serialStr}C A${routingStr}A ${accountingStr}C 03`;
        };

        const checksHtml = [];
        for (let i = printData.firstSerial; i <= printData.lastSerial; i++) {
            const micrLine = buildMicrLine(i);
            checksHtml.push(`
        <div class="check-wrapper">
          <section class="check">
            <div class="branch-name">${printData.branchName}</div>
            <div class="serial-left">${String(i).padStart(9, '0')}</div>
            <div class="serial-right">${String(i).padStart(9, '0')}</div>
            <div class="micr-line">${micrLine}</div>
          </section>
        </div>
      `);
        }

        const printHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>إعادة طباعة دفتر الصكوك المصدقة - ${printData.branchName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: 235mm 86mm; margin: 0; }
    @font-face { font-family: 'MICR'; src: url('/font/micrenc.ttf') format('truetype'); }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; background: #fff; font-family: 'Cairo', sans-serif; }
    .check-wrapper { width: 235mm; height: 86mm; page-break-after: always; page-break-inside: avoid; overflow: hidden; }
    .check-wrapper:last-child { page-break-after: auto; }
    .check { position: relative; width: 235mm; height: 86mm; background: #fff; }
    .branch-name { position: absolute; top: 20mm; left: 50%; transform: translateX(-50%); font-size: 14pt; font-weight: bold; text-align: center; }
    .serial-left { position: absolute; top: 18mm; left: 15mm; font-size: 12pt; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .serial-right { position: absolute; top: 18mm; right: 15mm; font-size: 12pt; font-family: 'Courier New', monospace; font-weight: bold; direction: ltr; }
    .micr-line { position: absolute; bottom: 10mm; left: 50%; transform: translateX(-50%); font-family: 'MICR', monospace; font-size: 12pt; font-weight: bold; letter-spacing: 0.15em; direction: ltr; white-space: nowrap; }
    @media screen { body { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; background: #f3f4f6; } .check-wrapper { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; } }
  </style>
</head>
<body>
  ${checksHtml.join('\n')}
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printHtml);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.print();
            };
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-3 rounded-xl shadow-lg">
                            <ClipboardList className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">سجلات الصكوك المصدقة</h1>
                            <p className="text-gray-600">عرض وإعادة طباعة دفاتر الصكوك المصدقة</p>
                        </div>
                    </div>
                    <button
                        onClick={loadLogs}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        تحديث
                    </button>
                </div>

                {/* Filters */}
                <div className="card">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline ml-1" />
                                تصفية حسب الفرع
                            </label>
                            <select
                                value={selectedBranch || ''}
                                onChange={(e) => {
                                    setSelectedBranch(e.target.value ? Number(e.target.value) : undefined);
                                    setPage(0);
                                }}
                                className="input"
                            >
                                <option value="">جميع الفروع</option>
                                {branches.map((branch) => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.branchName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Logs Table */}
                <div className="card">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-semibold">لا توجد سجلات حتى الآن</p>
                            <p className="text-sm text-gray-400 mt-2">
                                {selectedBranch 
                                    ? 'لا توجد سجلات للفرع المحدد' 
                                    : 'لم يتم طباعة أي دفتر صكوك مصدقة بعد'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-200 bg-gray-50">
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">الفرع</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">الرقم المحاسبي</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">من - إلى</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">عدد الدفاتر</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">عدد الصكوك</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">النوع</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">التاريخ والوقت</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">المستخدم</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">إجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-semibold text-gray-800">{log.branchName}</td>
                                                <td className="py-3 px-4 font-mono text-sm">{log.accountingNumber}</td>
                                                <td className="py-3 px-4 font-mono text-sm">
                                                    <span className="text-primary-600">{log.firstSerial}</span>
                                                    <span className="mx-1">-</span>
                                                    <span className="text-primary-600">{log.lastSerial}</span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold text-blue-600">
                                                    {(log as any).numberOfBooks || Math.ceil(log.totalChecks / 50)}
                                                </td>
                                                <td className="py-3 px-4 text-center font-bold text-primary-600">{log.totalChecks}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.operationType === 'print'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {log.operationType === 'print' ? 'طباعة' : 'إعادة طباعة'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-600">
                                                    <Calendar className="w-4 h-4 inline ml-1" />
                                                    {new Date(log.printDate).toLocaleString('ar-LY', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="py-3 px-4 text-sm">{log.printedByName}</td>
                                                <td className="py-3 px-4">
                                                    {canReprint && (
                                                        <button
                                                            onClick={() => openReprintModal(log)}
                                                            disabled={reprinting}
                                                            className="btn btn-secondary flex items-center gap-1 text-sm py-1.5"
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                            إعادة طباعة
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
                                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                                    <p className="text-sm text-gray-600">
                                        عرض {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} من {total}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="btn btn-secondary text-sm"
                                        >
                                            السابق
                                        </button>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={page >= totalPages - 1}
                                            className="btn btn-secondary text-sm"
                                        >
                                            التالي
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Reprint Modal */}
            {reprintModalOpen && selectedLog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-800">
                                إعادة طباعة صكوك مصدقة
                            </h3>
                            <button
                                onClick={() => setReprintModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                <p className="font-medium mb-1">تفاصيل الدفتر الأصلي:</p>
                                <p>الفرع: <span className="font-bold">{selectedLog.branchName}</span></p>
                                <p>النطاق: <span className="font-mono font-bold">{selectedLog.firstSerial} - {selectedLog.lastSerial}</span></p>
                                <p>عدد الصكوك: <span className="font-bold">{selectedLog.totalChecks}</span></p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        من رقم تسلسلي
                                    </label>
                                    <input
                                        type="number"
                                        value={reprintStartSerial}
                                        onChange={(e) => setReprintStartSerial(parseInt(e.target.value) || 0)}
                                        className="input w-full"
                                        min={selectedLog.firstSerial}
                                        max={selectedLog.lastSerial}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        إلى رقم تسلسلي
                                    </label>
                                    <input
                                        type="number"
                                        value={reprintEndSerial}
                                        onChange={(e) => setReprintEndSerial(parseInt(e.target.value) || 0)}
                                        className="input w-full"
                                        min={selectedLog.firstSerial}
                                        max={selectedLog.lastSerial}
                                    />
                                </div>
                            </div>

                            <div className="text-sm text-gray-500">
                                عدد الصكوك المحدد: <span className="font-bold text-gray-900">{Math.max(0, reprintEndSerial - reprintStartSerial + 1)}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    سبب إعادة الطباعة <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={reprintReason}
                                    onChange={(e) => setReprintReason(e.target.value as 'damaged' | 'not_printed' | '')}
                                    className="input w-full"
                                    required
                                >
                                    <option value="">-- اختر السبب --</option>
                                    <option value="damaged">ورقة تالفة (سيتم خصم من المخزون)</option>
                                    <option value="not_printed">ورقة لم تطبع (لن يتم خصم من المخزون)</option>
                                </select>
                                {reprintReason === 'damaged' && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        ⚠️ سيتم خصم {Math.max(0, reprintEndSerial - reprintStartSerial + 1)} ورقة من المخزون
                                    </p>
                                )}
                                {reprintReason === 'not_printed' && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ لن يتم خصم من المخزون لأن الورقة لم تطبع أصلاً
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setReprintModalOpen(false)}
                                className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                disabled={reprinting}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleConfirmReprint}
                                className="btn btn-primary flex items-center gap-2"
                                disabled={reprinting}
                            >
                                {reprinting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        جاري الطباعة...
                                    </>
                                ) : (
                                    <>
                                        <Printer className="w-4 h-4" />
                                        تأكيد الطباعة
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
