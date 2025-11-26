'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { branchService } from '@/lib/api';
import { Branch, CreateBranchRequest } from '@/types';
import { useAppSelector } from '@/store/hooks';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';

export default function BranchesPage() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  const [formData, setFormData] = useState<CreateBranchRequest>({
    branch_name: '',
    branch_location: '',
    routing_number: '',
    branch_number: '',
    accounting_number: '',
  });

  useEffect(() => {
    if (!currentUser?.isAdmin) {
      alert('ليس لديك صلاحية الوصول لهذه الصفحة');
      window.location.href = '/dashboard';
      return;
    }
    loadBranches();
  }, [currentUser]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingBranch) {
        await branchService.update(editingBranch.id, formData);
      } else {
        await branchService.create(formData);
      }
      
      setShowModal(false);
      setEditingBranch(null);
      setFormData({
        branch_name: '',
        branch_location: '',
        routing_number: '',
        branch_number: '',
        accounting_number: '',
      });
      loadBranches();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في حفظ الفرع');
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branchName,
      branch_location: branch.branchLocation,
      routing_number: branch.routingNumber,
      branch_number: branch.branchNumber || '',
      accounting_number: branch.accountingNumber || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (branchId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;
    
    try {
      await branchService.delete(branchId);
      loadBranches();
    } catch (error: any) {
      alert(error.response?.data?.error || 'فشل في حذف الفرع');
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الفروع</h1>
          <button
            onClick={() => {
              setEditingBranch(null);
              setFormData({
                branch_name: '',
                branch_location: '',
                routing_number: '',
                branch_number: '',
                accounting_number: '',
              });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة فرع
          </button>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div key={branch.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {branch.branchName}
                    </h3>
                    <p className="text-sm text-gray-500">{branch.branchLocation}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500">رقم التوجيه</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {branch.routingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">رقم الفرع</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {branch.branchNumber || 'غير محدد'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">الرقم المحاسبي</p>
                  <p className="font-mono font-semibold text-gray-800">
                    {branch.accountingNumber || 'غير محدد'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(branch)}
                  className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(branch.id)}
                  className="flex-1 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg px-4 py-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {branches.length === 0 && (
          <div className="card text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد فروع حتى الآن</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 btn btn-primary"
            >
              إضافة فرع جديد
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingBranch ? 'تعديل فرع' : 'إضافة فرع جديد'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفرع
                </label>
                <input
                  type="text"
                  value={formData.branch_name}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_name: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الموقع
                </label>
                <input
                  type="text"
                  value={formData.branch_location}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_location: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التوجيه (Routing Number)
                </label>
                <input
                  type="text"
                  value={formData.routing_number}
                  onChange={(e) =>
                    setFormData({ ...formData, routing_number: e.target.value })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الفرع
                </label>
                <input
                  type="text"
                  value={formData.branch_number}
                  onChange={(e) =>
                    setFormData({ ...formData, branch_number: e.target.value })
                  }
                  className="input"
                  placeholder="مثال: 123"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرقم المحاسبي
                </label>
                <input
                  type="text"
                  value={formData.accounting_number}
                  onChange={(e) =>
                    setFormData({ ...formData, accounting_number: e.target.value })
                  }
                  className="input"
                  placeholder="مثال: 001-2024"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn btn-primary">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBranch(null);
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

