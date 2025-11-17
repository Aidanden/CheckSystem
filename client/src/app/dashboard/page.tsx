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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
            <p className="text-gray-600">نظرة عامة على نظام طباعة الشيكات</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-primary-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">إجمالي العمليات</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.total_operations || 0}
                </p>
              </div>
              <div className="bg-primary-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-emerald-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">أوراق مطبوعة</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.total_sheets_printed || 0}
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-blue-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">حسابات فريدة</p>
                <p className="text-3xl font-bold text-gray-800">
                  {statistics?.unique_accounts || 0}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-r-4 border-amber-500 hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">مخزون أفراد</p>
                <p className="text-3xl font-bold text-gray-800">
                  {inventory.find((i) => i.stockType === 1)?.quantity || 0}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">حالة المخزون</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-bold text-gray-800 text-lg mb-1">
                    {item.stockType === 1 ? 'شيكات أفراد' : 'شيكات شركات'}
                  </p>
                  <p className="text-sm text-gray-600">
                    الكمية: <span className="font-bold text-primary-600 text-base">{item.quantity}</span> ورقة
                  </p>
                </div>
                <div
                  className={`px-4 py-2 rounded-lg text-sm font-bold ${
                    item.quantity > 100
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200'
                      : item.quantity > 50
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-200'
                      : 'bg-red-100 text-red-700 border-2 border-red-200'
                  }`}
                >
                  {item.quantity > 100 ? '✓ جيد' : item.quantity > 50 ? '⚠ متوسط' : '✗ منخفض'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Operations */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">آخر العمليات</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    رقم الحساب
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    النوع
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    الأوراق
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    التاريخ
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-bold text-gray-700">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOperations.length > 0 ? (
                  recentOperations.map((op) => (
                    <tr key={op.id} className="border-b border-gray-100 hover:bg-primary-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-gray-800">{op.accountNumber}</td>
                      <td className="py-4 px-4 text-sm">
                        <span className={`px-3 py-1 rounded-lg font-semibold ${
                          op.accountType === 1 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {op.accountType === 1 ? 'فردي' : 'شركة'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-primary-600">{op.sheetsPrinted}</td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {new Date(op.printDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-4 px-4">
                        <span className="badge badge-success">
                          {op.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-semibold">لا توجد عمليات حتى الآن</p>
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

