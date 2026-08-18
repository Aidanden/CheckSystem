'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { certifiedInstrumentLogService, userService, branchService, certifiedCheckService } from '@/lib/api';
import type { CertifiedInstrumentLog } from '@/lib/api/services/certifiedInstrumentLog.service';
import { ClipboardList, Filter, FileText, Download, Printer } from 'lucide-react';
import { formatDateMedium, formatNumber } from '@/utils/locale';
import { User } from '@/types';
import { Branch } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { openCertifiedInstrumentPrint } from '@/lib/utils/certifiedInstrumentPrint';
import { amountToArabicTafqeet } from '@/lib/utils/arabicAmountWords';
import { assertClientSameBranch } from '@/lib/utils/branchAccess';
import {
  downloadExcel,
  fetchAllPaginated,
  operationTypeLabel,
  reportFilename,
} from '@/lib/utils/exportReport';

export default function CertifiedInstrumentLogsPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const canReprint = currentUser?.isAdmin || currentUser?.permissions?.some((p) => p.permissionCode === 'REPRINT_CERTIFIED_INSTRUMENT');
  const [logs, setLogs] = useState<CertifiedInstrumentLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [reprintingId, setReprintingId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [stats, setStats] = useState({ total: 0, queries: 0, prints: 0, reprints: 0, lastOperationDate: null as string | null });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    operationType: '' as '' | 'query' | 'print' | 'reprint',
    accountNumber: '',
    txnRefNo: '',
    startDate: '',
    endDate: '',
    userId: undefined as number | undefined,
    branchId: undefined as number | undefined,
    limit: 20,
  });

  useEffect(() => {
    Promise.all([userService.getAll(), branchService.getAll(), certifiedCheckService.getSettings()])
      .then(([usersData, branchesData, settingsData]) => {
        setUsers(usersData);
        setBranches(branchesData);
        setSettings(settingsData);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    loadData();
  }, [page, filters]);

  const queryParams = () => ({
    page,
    limit: filters.limit,
    operationType: filters.operationType || undefined,
    accountNumber: filters.accountNumber.trim() || undefined,
    txnRefNo: filters.txnRefNo.trim() || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    userId: filters.userId,
    branchId: filters.branchId,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = queryParams();
      const [logsRes, statsRes] = await Promise.all([
        certifiedInstrumentLogService.getAll(params),
        certifiedInstrumentLogService.getStatistics(params),
      ]);
      setLogs(logsRes.logs);
      setTotal(logsRes.total);
      setStats({ ...statsRes, reprints: statsRes.reprints ?? 0 });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'فشل تحميل السجلات');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  const operationLabel = (type: string) =>
    type === 'reprint' ? 'إعادة طباعة' : type === 'print' ? 'طباعة' : 'استعلام';

  const handleReprint = async (log: CertifiedInstrumentLog) => {
    if (!canReprint) return;
    const branchError = assertClientSameBranch(currentUser, log.txnBranch);
    if (branchError) {
      setError(branchError);
      return;
    }
    setReprintingId(log.id);
    setError(null);
    try {
      const words = log.amountWords || amountToArabicTafqeet(Number(log.amount) || 0);
      await certifiedInstrumentLogService.create({
        operationType: 'reprint',
        txnRefNo: log.txnRefNo,
        instrumentNo: log.instrumentNo,
        accountNumber: log.accountNumber,
        accountHolderName: log.accountHolderName,
        beneficiaryName: log.beneficiaryName,
        amount: log.amount,
        currency: log.currency,
        issueDate: log.issueDate,
        txnBranch: log.txnBranch,
        branchId: log.branchId,
        branchName: log.branchName,
        routingNumber: log.routingNumber,
        accountingNumber: log.accountingNumber,
        amountWords: words,
      });
      const latestSettings = await certifiedCheckService.getSettings().catch(() => settings);
      setSettings(latestSettings);
      const opened = openCertifiedInstrumentPrint(
        {
          instrumentNo: log.instrumentNo,
          accountNumber: log.accountNumber,
          accountHolderName: log.accountHolderName,
          beneficiaryName: log.beneficiaryName,
          amount: log.amount,
          issueDate: log.issueDate,
          branchName: log.branchName,
          routingNumber: log.routingNumber,
          accountingNumber: log.accountingNumber,
        },
        words,
        latestSettings
      );
      if (!opened) {
        setError('تم تسجيل إعادة الطباعة وتعذر فتح نافذة الطباعة. اسمح بالنوافذ المنبثقة.');
      }
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'فشل إعادة الطباعة');
    } finally {
      setReprintingId(null);
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      const exportParams = {
        limit: filters.limit,
        operationType: filters.operationType || undefined,
        accountNumber: filters.accountNumber.trim() || undefined,
        txnRefNo: filters.txnRefNo.trim() || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        userId: filters.userId,
        branchId: filters.branchId,
      };
      const exportLogs = await fetchAllPaginated({
        pageSize: 500,
        fetchPage: async (skip, take) => {
          const page = Math.floor(skip / take);
          const res = await certifiedInstrumentLogService.getAll({
            ...exportParams,
            page,
            limit: take,
          });
          return { items: res.logs, total: res.total };
        },
      });

      const headers = [
        'التاريخ',
        'النوع',
        'الرقم المرجعي',
        'رقم الصك',
        'رقم الحساب',
        'صاحب الحساب',
        'المستفيد',
        'المبلغ',
        'العملة',
        'الفرع',
        'المستخدم',
      ];
      const rows = exportLogs.map((log) => [
        formatDateMedium(log.createdAt),
        operationTypeLabel(log.operationType),
        log.txnRefNo,
        log.instrumentNo || '—',
        log.accountNumber || '—',
        log.accountHolderName || '—',
        log.beneficiaryName || '—',
        log.amount != null ? log.amount : '—',
        log.currency || '—',
        log.branchName || log.txnBranch || '—',
        log.performedByName,
      ]);

      downloadExcel({
        filename: reportFilename('تقرير-صك-المنظومة'),
        sheetName: 'صكوك المنظومة',
        headers,
        rows,
        summaryRows: [
          ['كل العمليات', stats.total],
          ['استعلام', stats.queries],
          ['طباعة', stats.prints],
          ['إعادة طباعة', stats.reprints],
        ],
      });
    } catch (err) {
      console.error('فشل تصدير التقرير:', err);
      alert('فشل تصدير التقرير. حاول مرة أخرى.');
    } finally {
      setExporting(false);
    }
  };

  const printReport = () => {
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>تقرير صكوك المنظومة</title>
<style>
  body { font-family: Cairo, Tahoma, sans-serif; padding: 20px; }
  h1 { font-size: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: center; }
  th { background: #f3f4f6; }
</style></head><body>
<h1>سجل طباعة الصك المصدق من المنظومة</h1>
<p>الإجمالي: ${stats.total} | استعلام: ${stats.queries} | طباعة: ${stats.prints}</p>
<table>
<thead><tr>
<th>التاريخ</th><th>النوع</th><th>الرقم المرجعي</th><th>رقم الصك</th><th>رقم الحساب</th><th>المستفيد</th><th>المبلغ</th><th>الفرع</th><th>المستخدم</th>
</tr></thead>
<tbody>
${logs.map((log) => `<tr>
<td>${formatDateMedium(log.createdAt)}</td>
<td>${operationLabel(log.operationType)}</td>
<td>${log.txnRefNo}</td>
<td>${log.instrumentNo || ''}</td>
<td>${log.accountNumber || ''}</td>
<td>${log.beneficiaryName || ''}</td>
<td>${log.amount != null ? log.amount : ''}</td>
<td>${log.branchName || log.txnBranch || ''}</td>
<td>${log.performedByName}</td>
</tr>`).join('')}
</tbody></table>
<script>window.onload=()=>window.print()</script>
</body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-lg">
              <ClipboardList className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">سجل طباعة الصك المصدق من المنظومة</h1>
              <p className="text-sm text-gray-600">كل استعلام وكل طباعة تُسجَّل، بما فيها التكرار</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              disabled={logs.length === 0 || exporting}
              className="btn bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {exporting ? 'جاري التصدير...' : 'تصدير Excel'}
            </button>
            <button onClick={printReport} className="btn btn-primary flex items-center gap-2">
              <FileText className="w-4 h-4" /> طباعة التقرير
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card"><p className="text-sm text-gray-500">كل العمليات</p><p className="text-2xl font-bold">{formatNumber(stats.total)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">استعلام بدون/مع طباعة</p><p className="text-2xl font-bold">{formatNumber(stats.queries)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">عمليات الطباعة</p><p className="text-2xl font-bold">{formatNumber(stats.prints)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">إعادة الطباعة</p><p className="text-2xl font-bold">{formatNumber(stats.reprints)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">آخر عملية</p><p className="text-lg font-semibold">{stats.lastOperationDate ? formatDateMedium(stats.lastOperationDate) : '—'}</p></div>
        </div>

        <div className="card space-y-4">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 font-semibold text-gray-800">
            <Filter className="w-4 h-4" /> فلترة حسب المستخدم والتاريخ ورقم الحساب والفرع
          </button>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input" placeholder="رقم الحساب" value={filters.accountNumber} onChange={(e) => { setPage(0); setFilters({ ...filters, accountNumber: e.target.value }); }} />
              <input className="input" placeholder="الرقم المرجعي" value={filters.txnRefNo} onChange={(e) => { setPage(0); setFilters({ ...filters, txnRefNo: e.target.value }); }} />
              <select className="input" value={filters.operationType} onChange={(e) => { setPage(0); setFilters({ ...filters, operationType: e.target.value as any }); }}>
                <option value="">كل الأنواع</option>
                <option value="query">استعلام</option>
                <option value="print">طباعة</option>
                <option value="reprint">إعادة طباعة</option>
              </select>
              <select className="input" value={filters.userId ?? ''} onChange={(e) => { setPage(0); setFilters({ ...filters, userId: e.target.value ? Number(e.target.value) : undefined }); }}>
                <option value="">كل المستخدمين</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
              </select>
              {currentUser?.isAdmin && (
              <select className="input" value={filters.branchId ?? ''} onChange={(e) => { setPage(0); setFilters({ ...filters, branchId: e.target.value ? Number(e.target.value) : undefined }); }}>
                <option value="">كل الفروع</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branchName}</option>)}
              </select>
              )}
              <input type="date" className="input" value={filters.startDate} onChange={(e) => { setPage(0); setFilters({ ...filters, startDate: e.target.value }); }} />
              <input type="date" className="input" value={filters.endDate} onChange={(e) => { setPage(0); setFilters({ ...filters, endDate: e.target.value }); }} />
              <button onClick={() => { setPage(0); setFilters({ operationType: '', accountNumber: '', txnRefNo: '', startDate: '', endDate: '', userId: undefined, branchId: undefined, limit: 20 }); }} className="btn bg-gray-100">إعادة تعيين</button>
            </div>
          )}
        </div>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

        <div className="card overflow-x-auto">
          {loading ? (
            <p className="p-6 text-center text-gray-500">جاري التحميل...</p>
          ) : logs.length === 0 ? (
            <p className="p-6 text-center text-gray-500">لا توجد عمليات</p>
          ) : (
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-center font-semibold">التاريخ</th>
                  <th className="p-3 text-center font-semibold">النوع</th>
                  <th className="p-3 text-center font-semibold">الرقم المرجعي</th>
                  <th className="p-3 text-center font-semibold">رقم الصك</th>
                  <th className="p-3 text-center font-semibold">رقم الحساب</th>
                  <th className="p-3 text-center font-semibold">المستفيد</th>
                  <th className="p-3 text-center font-semibold">المبلغ</th>
                  <th className="p-3 text-center font-semibold">الفرع</th>
                  <th className="p-3 text-center font-semibold">المستخدم</th>
                  {canReprint && <th className="p-3 text-center font-semibold">إجراء</th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center whitespace-nowrap">{formatDateMedium(log.createdAt)}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        log.operationType === 'print'
                          ? 'bg-green-100 text-green-700'
                          : log.operationType === 'reprint'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-700'
                      }`}>
                        {operationLabel(log.operationType)}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono break-all" dir="ltr">{log.txnRefNo}</td>
                    <td className="p-3 text-center font-mono break-all" dir="ltr">{log.instrumentNo || '—'}</td>
                    <td className="p-3 text-center font-mono break-all" dir="ltr">{log.accountNumber || '—'}</td>
                    <td className="p-3 text-center whitespace-normal break-words">{log.beneficiaryName || '—'}</td>
                    <td className="p-3 text-center" dir="ltr">{log.amount != null ? log.amount : '—'}</td>
                    <td className="p-3 text-center whitespace-normal break-words">{log.branchName || log.txnBranch || '—'}</td>
                    <td className="p-3 text-center">{log.performedByName}</td>
                    {canReprint && (
                      <td className="p-3 text-center">
                        {(log.operationType === 'print' || log.operationType === 'reprint') ? (
                          <button
                            onClick={() => handleReprint(log)}
                            disabled={reprintingId === log.id || !log.routingNumber || !log.accountingNumber}
                            className="btn bg-amber-50 text-amber-800 text-xs inline-flex items-center justify-center gap-1 disabled:opacity-50 mx-auto"
                          >
                            <Printer className="w-3 h-3" />
                            {reprintingId === log.id ? 'جاري...' : 'إعادة طباعة'}
                          </button>
                        ) : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex items-center justify-between p-3 text-sm text-gray-600">
            <span>صفحة {page + 1} من {totalPages} — {total} عملية</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="btn bg-gray-100 disabled:opacity-50">السابق</button>
              <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn bg-gray-100 disabled:opacity-50">التالي</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
