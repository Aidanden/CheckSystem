'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { inventoryService, printingService } from '@/lib/api';
import { Inventory, PrintStatistics, PrintOperation } from '@/types';
import { Package, FileText, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);
  const [recentOperations, setRecentOperations] = useState<PrintOperation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [inv, stats, ops] = await Promise.all([
        inventoryService.getAll(),
        printingService.getStatistics(),
        printingService.getHistory(undefined, 5),
      ]);

      setInventory(inv);
      setStatistics(stats);
      setRecentOperations(ops);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي العمليات</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {statistics?.total_operations || 0}
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">أوراق مطبوعة</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {statistics?.total_sheets_printed || 0}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">حسابات فريدة</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {statistics?.unique_accounts || 0}
                </p>
              </div>
              <FileText className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مخزون أفراد</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {inventory.find((i) => i.stockType === 1)?.quantity || 0}
                </p>
              </div>
              <Package className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">حالة المخزون</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {item.stockType === 1 ? 'شيكات أفراد' : 'شيكات شركات'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    الكمية: {item.quantity} ورقة
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.quantity > 100
                      ? 'bg-green-100 text-green-700'
                      : item.quantity > 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.quantity > 100 ? 'جيد' : item.quantity > 50 ? 'متوسط' : 'منخفض'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Operations */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">آخر العمليات</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    رقم الحساب
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    النوع
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الأوراق
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    التاريخ
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.length > 0 ? (
                  recentOperations.map((op) => (
                    <tr key={op.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{op.accountNumber}</td>
                      <td className="py-3 px-4 text-sm">
                        {op.accountType === 1 ? 'فردي' : 'شركة'}
                      </td>
                      <td className="py-3 px-4 text-sm">{op.sheetsPrinted}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(op.printDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      لا توجد عمليات حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

