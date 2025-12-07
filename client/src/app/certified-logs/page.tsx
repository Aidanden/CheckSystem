'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedCheckService } from '@/lib/api';
import { CertifiedCheckLog, CertifiedBranch } from '@/lib/api/services/certifiedCheck.service';
import { useAppSelector } from '@/store/hooks';
import { ClipboardList, Printer, RefreshCw, Eye, Building2, Calendar } from 'lucide-react';

export default function CertifiedLogsPage() {
    const { user } = useAppSelector((state) => state.auth);
    const [logs, setLogs] = useState<CertifiedCheckLog[]>([]);
    const [branches, setBranches] = useState<CertifiedBranch[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reprinting, setReprinting] = useState<number | null>(null);
    const [page, setPage] = useState(0);
    const [selectedBranch, setSelectedBranch] = useState<number | undefined>(undefined);
    const pageSize = 10;

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
            setLogs(result.logs);
            setTotal(result.total);
        } catch (err) {
            console.error('Error loading logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReprint = async (logId: number) => {
        if (!confirm('هل أنت متأكد من إعادة طباعة هذا الدفتر؟')) return;

        try {
            setReprinting(logId);
            const result = await certifiedCheckService.reprintBook(logId);

            if (result.success) {
                // Open print window
                openPrintWindow(result.printData);
                loadLogs(); // Refresh logs
            }
        } catch (err: any) {
            console.error('Error reprinting:', err);
            alert(err.response?.data?.error || 'فشل في إعادة الطباعة');
        } finally {
            setReprinting(null);
        }
    };

    const openPrintWindow = (printData: any) => {
        const buildMicrLine = (serial: number) => {
            return `C${String(serial).padStart(6, '0')}C A${printData.routingNumber}A ${printData.accountingNumber}C 03`;
        };

        const checksHtml = [];
        for (let i = printData.firstSerial; i <= printData.lastSerial; i++) {
            const micrLine = buildMicrLine(i);
            checksHtml.push(`
        <div class="check-wrapper">
          <section class="check">
            <div class="branch-name">${printData.branchName}</div>
            <div class="serial-left">${String(i).padStart(6, '0')}</div>
            <div class="serial-right">${String(i).padStart(6, '0')}</div>
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

    const canReprint = user?.isAdmin || user?.permissions?.some(p => p.permissionCode === 'REPRINT_CERTIFIED');

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
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">عدد الصكوك</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">النوع</th>
                                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-700">التاريخ</th>
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
                                                    {new Date(log.printDate).toLocaleDateString('ar-LY')}
                                                </td>
                                                <td className="py-3 px-4 text-sm">{log.printedByName}</td>
                                                <td className="py-3 px-4">
                                                    {canReprint && (
                                                        <button
                                                            onClick={() => handleReprint(log.id)}
                                                            disabled={reprinting === log.id}
                                                            className="btn btn-secondary flex items-center gap-1 text-sm py-1.5"
                                                        >
                                                            {reprinting === log.id ? (
                                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Printer className="w-4 h-4" />
                                                            )}
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
        </DashboardLayout>
    );
}
