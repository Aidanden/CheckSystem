'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { printingService, branchService, userService } from '@/lib/api';
import { PrintOperation, PrintStatistics, Branch, User } from '@/types';
import { FileText, Download, Filter, Calendar, X, Search } from 'lucide-react';
import { formatDateShort, formatDateMedium, formatNumber } from '@/utils/locale';
import { RootState } from '@/store';

export default function ReportsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [operations, setOperations] = useState<PrintOperation[]>([]);
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    branchId: undefined as number | undefined,
    userId: undefined as number | undefined,
    accountNumber: '',
    dateFrom: '',
    dateTo: '',
    limit: 50,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      // Load branches and users for filters (only if admin)
      if (user?.isAdmin) {
        const [branchesData, usersData] = await Promise.all([
          branchService.getAll(),
          userService.getAll(),
        ]);
        setBranches(branchesData);
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);

      // Build filters object
      const apiFilters: any = {
        limit: filters.limit,
      };

      if (filters.branchId) apiFilters.branchId = filters.branchId;
      if (filters.userId) apiFilters.userId = filters.userId;
      if (filters.accountNumber) apiFilters.accountNumber = filters.accountNumber;
      if (filters.dateFrom) apiFilters.dateFrom = filters.dateFrom;
      if (filters.dateTo) apiFilters.dateTo = filters.dateTo;

      const [ops, stats] = await Promise.all([
        printingService.getHistory(apiFilters),
        printingService.getStatistics(filters.branchId),
      ]);

      setOperations(ops);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      branchId: undefined,
      userId: undefined,
      accountNumber: '',
      dateFrom: '',
      dateTo: '',
      limit: 50,
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'رقم الحساب', 'النوع', 'الأوراق', 'من', 'إلى', 'التاريخ', 'الحالة', 'المستخدم', 'الفرع'];
    const rows = operations.map((op: any) => [
      op.id,
      op.accountNumber,
      op.accountType === 1 ? 'فردي' : 'شركة',
      op.sheetsPrinted,
      op.serialFrom,
      op.serialTo,
      formatDateShort(op.printDate),
      op.status,
      op.user?.username || '-',
      op.branch?.branchName || '-',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير-عمليات-الطباعة-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading && operations.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const activeFiltersCount = [
    filters.branchId,
    filters.userId,
    filters.accountNumber,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">التقارير والإحصائيات</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-secondary' : 'btn-outline'} flex items-center gap-2`}
            >
              <Filter className="w-5 h-5" />
              فلترة
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={exportToCSV}
              className="btn btn-primary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              تصدير CSV
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">خيارات الفلترة</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Branch Filter - Only for Admin */}
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفرع
                  </label>
                  <select
                    value={filters.branchId || ''}
                    onChange={(e) => handleFilterChange('branchId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">جميع الفروع</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* User Filter - Only for Admin */}
              {user?.isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المستخدم
                  </label>
                  <select
                    value={filters.userId || ''}
                    onChange={(e) => handleFilterChange('userId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="input w-full"
                  >
                    <option value="">جميع المستخدمين</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Account Number Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الحساب
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.accountNumber}
                    onChange={(e) => handleFilterChange('accountNumber', e.target.value)}
                    placeholder="ابحث برقم الحساب..."
                    className="input w-full pr-10"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  من تاريخ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="input w-full"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Date To Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  إلى تاريخ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="input w-full"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Limit Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد السجلات
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  className="input w-full"
                >
                  <option value={25}>آخر 25 عملية</option>
                  <option value={50}>آخر 50 عملية</option>
                  <option value={100}>آخر 100 عملية</option>
                  <option value={500}>آخر 500 عملية</option>
                  <option value={1000}>آخر 1000 عملية</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <p className="text-sm text-gray-600">شركات (50)</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {statistics?.corporate_50 || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600">أفراد (25)</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {statistics?.individual_25 || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600">موظفين (10)</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {statistics?.employees_10 || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600">عمليات إعادة طباعة</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {statistics?.reprint_operations || 0}
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600">أوراق معاد طباعتها</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {statistics?.reprint_sheets || 0}
            </p>
          </div>
        </div>

        {/* Operations Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              سجل عمليات الطباعة
            </h2>
            <p className="text-sm text-gray-600">
              عدد النتائج: {operations.length}
            </p>
          </div>

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
                  {user?.isAdmin && (
                    <>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                        المستخدم
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                        الفرع
                      </th>
                    </>
                  )}
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {operations.length === 0 ? (
                  <tr>
                    <td colSpan={user?.isAdmin ? 9 : 7} className="py-8 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>لا توجد عمليات طباعة</p>
                    </td>
                  </tr>
                ) : (
                  operations.map((op: any) => (
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
                      {user?.isAdmin && (
                        <>
                          <td className="py-3 px-4 text-sm">
                            {op.user?.username || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {op.branch?.branchName || '-'}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${op.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-700'
                            : op.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {op.status === 'COMPLETED' ? 'مكتمل' : op.status === 'PENDING' ? 'قيد الانتظار' : 'فشل'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
