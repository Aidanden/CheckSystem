'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printingService } from '@/lib/api';
import { PrintOperation, PrintStatistics } from '@/types';
import { FileText, Download, Filter, Calendar } from 'lucide-react';
import { formatDateShort, formatDateMedium, formatNumber } from '@/utils/locale';

export default function ReportsPage() {
  const [operations, setOperations] = useState<PrintOperation[]>([]);
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadReportData();
  }, [limit]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [ops, stats] = await Promise.all([
        printingService.getHistory(undefined, limit),
        printingService.getStatistics(),
      ]);
      setOperations(ops);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Account Number', 'Account Type', 'Sheets', 'Date', 'Status'];
    const rows = operations.map((op) => [
      op.id,
      op.accountNumber,
      op.accountType === 1 ? 'Individual' : 'Corporate',
      op.sheetsPrinted,
      formatDateShort(op.printDate),
      op.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-operations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h1>
          <button
            onClick={exportToCSV}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            تصدير CSV
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <p className="text-sm text-gray-600">إجمالي العمليات</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {statistics?.total_operations || 0}
            </p>
          </div>
          
          <div className="card">
            <p className="text-sm text-gray-600">أوراق مطبوعة</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {statistics?.total_sheets_printed || 0}
            </p>
          </div>
          
          <div className="card">
            <p className="text-sm text-gray-600">حسابات فريدة</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {statistics?.unique_accounts || 0}
            </p>
          </div>
          
          <div className="card">
            <p className="text-sm text-gray-600">متوسط الأوراق</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {statistics &&
              Number(statistics.total_operations) > 0
                ? Math.round(
                    Number(statistics.total_sheets_printed) /
                      Number(statistics.total_operations)
                  )
                : 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="input max-w-xs"
            >
              <option value={25}>آخر 25 عملية</option>
              <option value={50}>آخر 50 عملية</option>
              <option value={100}>آخر 100 عملية</option>
              <option value={500}>آخر 500 عملية</option>
            </select>
          </div>
        </div>

        {/* Operations Table */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            سجل عمليات الطباعة
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    #
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    رقم الحساب
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    النوع
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    من - إلى
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الأوراق
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    التاريخ والوقت
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{op.id}</td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {op.accountNumber}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {op.accountType === 1 ? 'فردي' : 'شركة'}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">
                      {op.serialFrom} - {op.serialTo}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold">
                      {op.sheetsPrinted}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDateMedium(op.printDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          op.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : op.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {op.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

