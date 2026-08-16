'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { customerCategoryService, type CustomerCategory } from '@/lib/api/services/customerCategory.service';
import { Layers, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';

export default function CategorySettingsPage() {
  const [categories, setCategories] = useState<CustomerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<CustomerCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryCode: '', description: '', typeCode: '01' });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      setCategories(await customerCategoryService.getAll());
    } catch (err: any) {
      setError(err?.response?.data?.error || 'فشل تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ categoryCode: '', description: '', typeCode: '01' });
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ categoryCode: '', description: '', typeCode: '01' });
    setShowForm(true);
  };

  const openEdit = (item: CustomerCategory) => {
    setEditing(item);
    setForm({
      categoryCode: item.categoryCode,
      description: item.description,
      typeCode: item.typeCode === '02' ? '02' : '01',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await customerCategoryService.update(editing.id, form);
      } else {
        await customerCategoryService.create(form);
      }
      resetForm();
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'فشل حفظ الفئة');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CustomerCategory) => {
    if (!confirm(`حذف الفئة ${item.categoryCode}؟`)) return;
    try {
      await customerCategoryService.delete(item.id);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'فشل الحذف');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-100 rounded-xl">
              <Layers className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">عدادات الفئات</h1>
              <p className="text-sm text-gray-600">
                الخانات 4 إلى 6 من رقم الحساب تُقارن برمز الفئة لتحديد طباعة 01 (أفراد) أو 02 (شركات)
              </p>
            </div>
          </div>
          <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة فئة
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="card space-y-4">
            <h2 className="font-semibold text-gray-800">{editing ? 'تعديل فئة' : 'فئة جديدة'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">رمز الفئة (CUSTOMER_CATEGORY)</label>
                <input
                  className="input w-full font-mono"
                  dir="ltr"
                  maxLength={3}
                  value={form.categoryCode}
                  onChange={(e) => setForm({ ...form, categoryCode: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">النوع</label>
                <select
                  className="input w-full"
                  value={form.typeCode}
                  onChange={(e) => setForm({ ...form, typeCode: e.target.value })}
                >
                  <option value="01">01 — أفراد</option>
                  <option value="02">02 — شركات</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-600 mb-1">الوصف</label>
                <input
                  className="input w-full"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button type="button" onClick={resetForm} className="btn bg-gray-100">
                إلغاء
              </button>
            </div>
          </form>
        )}

        <div className="card overflow-x-auto">
          {loading ? (
            <p className="p-6 text-center text-gray-500">جاري التحميل...</p>
          ) : (
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="border-b">
                  <th className="p-3">CUSTOMER_CATEGORY</th>
                  <th className="p-3">الوصف</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold" dir="ltr">{item.categoryCode}</td>
                    <td className="p-3">{item.description}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        item.typeCode === '02' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {item.typeCode === '02' ? '02 شركات' : '01 أفراد'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="inline-flex gap-2">
                        <button onClick={() => openEdit(item)} className="text-primary-600 hover:text-primary-800">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
