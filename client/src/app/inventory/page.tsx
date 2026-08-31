'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { inventoryService, branchService } from '@/lib/api';
import { Inventory, InventoryTransaction, Branch } from '@/types';
import { Package, Plus, History, TrendingUp, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { formatDateShort, formatNumber } from '@/utils/locale';
import { useAppSelector } from '@/store/hooks';

export default function InventoryPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState<InventoryTransaction | null>(null);
  const [editQuantity, setEditQuantity] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [addForm, setAddForm] = useState({
    stock_type: 1 as 1 | 2,
    quantity: 0,
    branch_id: undefined as number | undefined,
    notes: '',
  });

  useEffect(() => {
    if (!currentUser) return;
    if (!currentUser.isAdmin && currentUser.branchId) {
      setSelectedBranchId(currentUser.branchId);
      setAddForm((f) => ({ ...f, branch_id: currentUser.branchId }));
    }
    branchService
      .getAll()
      .then((data) => setBranches(data))
      .catch((err) => console.error('Failed to load branches:', err));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    if (!currentUser.isAdmin && !currentUser.branchId) return;
    loadInventoryData();
  }, [currentUser, selectedBranchId]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const branchFilter = selectedBranchId;
      const [inv, trans] = await Promise.all([
        inventoryService.getAll(branchFilter),
        inventoryService.getTransactionHistory(undefined, 100, branchFilter),
      ]);
      setInventory(inv.filter((item) => item.stockType !== 3));
      setTransactions(trans.filter((item) => item.stockType !== 3));
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const branchId = addForm.branch_id ?? selectedBranchId ?? currentUser?.branchId;
    if (!branchId) {
      alert('يجب اختيار الفرع');
      return;
    }
    try {
      await inventoryService.addStock({
        stock_type: addForm.stock_type,
        quantity: addForm.quantity,
        branch_id: branchId,
        notes: addForm.notes,
      });
      setShowAddModal(false);
      setAddForm({
        stock_type: 1,
        quantity: 0,
        branch_id: currentUser?.isAdmin ? selectedBranchId : currentUser?.branchId,
        notes: '',
      });
      loadInventoryData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في إضافة المخزون');
    }
  };

  const handleReverse = async (trans: InventoryTransaction) => {
    const kind = trans.transactionType === 'ADD' ? 'الإضافة' : 'الخصم';
    const confirmed = window.confirm(
      `هل تريد إلغاء عملية ${kind} رقم ${trans.id} بكمية ${trans.quantity}؟\nسيتم تعديل رصيد المخزون وإزالة العملية من السجل.`
    );
    if (!confirmed) return;
    try {
      setBusyId(trans.id);
      await inventoryService.reverseTransaction(trans.id);
      await loadInventoryData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل إلغاء العملية');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (trans: InventoryTransaction) => {
    if (trans.transactionType !== 'ADD') {
      alert('يمكن تعديل عمليات الإضافة فقط. لخصم خاطئ استخدم زر الإلغاء.');
      return;
    }
    setEditTx(trans);
    setEditQuantity(trans.quantity);
    setEditNotes(trans.notes || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx) return;
    try {
      setBusyId(editTx.id);
      await inventoryService.updateTransaction(editTx.id, {
        quantity: editQuantity,
        notes: editNotes,
      });
      setEditTx(null);
      await loadInventoryData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل تعديل العملية');
    } finally {
      setBusyId(null);
    }
  };

  const branchLabel = (item: { branchId?: number | null; branch?: Inventory['branch'] }) => {
    if (item.branch) {
      return `${item.branch.branchName} (${item.branch.branchNumber})`;
    }
    if (item.branchId) {
      const b = branches.find((x) => x.id === item.branchId);
      return b ? `${b.branchName} (${b.branchNumber})` : `فرع #${item.branchId}`;
    }
    return '-';
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-800">إدارة المخزون</h1>
          <div className="flex flex-wrap items-center gap-3">
            {currentUser?.isAdmin && (
              <select
                value={selectedBranchId ?? ''}
                onChange={(e) =>
                  setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="input min-w-[200px]"
              >
                <option value="">كل الفروع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName} ({b.branchNumber})
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                setAddForm((f) => ({
                  ...f,
                  branch_id: selectedBranchId ?? currentUser?.branchId,
                }));
                setShowAddModal(true);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مخزون
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          مخزون الأفراد والشركات منفصل لكل فرع. الطباعة تخصم من مخزون فرع رقم الحساب.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inventory.length === 0 ? (
            <div className="card col-span-full text-center text-gray-500 py-8">
              لا يوجد مخزون للعرض — اختر فرعاً أو أضف مخزوناً
            </div>
          ) : (
            inventory.map((item) => (
              <div key={item.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {item.stockType === 1 ? 'شيكات أفراد وموظفين' : 'شيكات شركات'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{branchLabel(item)}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-500" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">الكمية المتاحة:</span>
                    <span className="text-2xl font-bold text-gray-800">
                      {formatNumber(item.quantity)}
                    </span>
                  </div>

                  <div
                    className={`mt-4 px-4 py-2 rounded-lg text-center font-medium ${
                      item.quantity > 100
                        ? 'bg-green-100 text-green-700'
                        : item.quantity > 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {item.quantity > 100
                      ? 'المخزون جيد'
                      : item.quantity > 50
                        ? 'المخزون متوسط'
                        : 'المخزون منخفض - يرجى إضافة مخزون'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">سجل حركة المخزون</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الفرع</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">النوع</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">العملية</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الكمية</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">التاريخ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">ملاحظات</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      لا توجد حركات مخزون
                    </td>
                  </tr>
                ) : (
                  transactions.map((trans) => (
                    <tr key={trans.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-400">{trans.id}</td>
                      <td className="py-3 px-4 text-sm">{branchLabel(trans)}</td>
                      <td className="py-3 px-4 text-sm">
                        {trans.stockType === 1 ? 'أفراد/موظفين' : 'شركات'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`flex items-center gap-1 text-sm ${
                            trans.transactionType === 'ADD' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {trans.transactionType === 'ADD' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {trans.transactionType === 'ADD' ? 'إضافة' : 'خصم'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{trans.quantity}</td>
                      <td className="py-3 px-4 text-sm">{formatDateShort(trans.createdAt)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{trans.notes || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {trans.transactionType === 'ADD' && (
                            <button
                              onClick={() => openEdit(trans)}
                              disabled={busyId === trans.id}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 disabled:opacity-50"
                              title="تعديل الكمية"
                            >
                              <Pencil className="w-4 h-4" />
                              تعديل
                            </button>
                          )}
                          <button
                            onClick={() => handleReverse(trans)}
                            disabled={busyId === trans.id}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 disabled:opacity-50"
                            title="إلغاء العملية"
                          >
                            <Trash2 className="w-4 h-4" />
                            إلغاء
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">إضافة مخزون جديد</h2>
            <form onSubmit={handleAddStock} className="space-y-4">
              {currentUser?.isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الفرع</label>
                  <select
                    value={addForm.branch_id ?? ''}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        branch_id: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="input"
                    required
                  >
                    <option value="">اختر الفرع</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchName} ({b.branchNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الشيكات</label>
                <select
                  value={addForm.stock_type}
                  onChange={(e) =>
                    setAddForm({ ...addForm, stock_type: Number(e.target.value) as 1 | 2 })
                  }
                  className="input"
                  required
                >
                  <option value={1}>شيكات أفراد وموظفين</option>
                  <option value={2}>شيكات شركات</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكمية</label>
                <input
                  type="number"
                  value={addForm.quantity}
                  onChange={(e) => setAddForm({ ...addForm, quantity: Number(e.target.value) })}
                  className="input"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  إضافة
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 btn btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editTx && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">تعديل عملية إضافة</h2>
            <p className="text-sm text-gray-600 mb-4">
              العملية #{editTx.id} — {branchLabel(editTx)} —{' '}
              {editTx.stockType === 1 ? 'أفراد/موظفين' : 'شركات'} — الكمية الحالية{' '}
              {editTx.quantity}
            </p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الكمية الصحيحة</label>
                <input
                  type="number"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Number(e.target.value))}
                  className="input"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={busyId === editTx.id}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  حفظ التعديل
                </button>
                <button
                  type="button"
                  onClick={() => setEditTx(null)}
                  className="flex-1 btn btn-secondary"
                >
                  إغلاق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
