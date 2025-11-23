'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Settings as SettingsIcon, Save, RotateCcw } from 'lucide-react';

interface PrintPosition {
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

interface PrintSettings {
  id?: number;
  accountType: 1 | 2;
  checkWidth: number;
  checkHeight: number;
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;
}

const DEFAULT_INDIVIDUAL: PrintSettings = {
  accountType: 1,
  checkWidth: 235,
  checkHeight: 86,
  branchName: { x: 117.5, y: 10, fontSize: 14, align: 'center' },
  serialNumber: { x: 200, y: 18, fontSize: 12, align: 'right' },
  accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' },
  micrLine: { x: 117.5, y: 80, fontSize: 12, align: 'center' },
};

const DEFAULT_CORPORATE: PrintSettings = {
  accountType: 2,
  checkWidth: 240,
  checkHeight: 86,
  branchName: { x: 120, y: 10, fontSize: 14, align: 'center' },
  serialNumber: { x: 205, y: 18, fontSize: 12, align: 'right' },
  accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' },
  micrLine: { x: 120, y: 80, fontSize: 12, align: 'center' },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [individualSettings, setIndividualSettings] = useState<PrintSettings>(DEFAULT_INDIVIDUAL);
  const [corporateSettings, setCorporateSettings] = useState<PrintSettings>(DEFAULT_CORPORATE);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  const currentSettings = activeTab === 1 ? individualSettings : corporateSettings;
  const setCurrentSettings = activeTab === 1 ? setIndividualSettings : setCorporateSettings;

  // Load settings from backend
  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setInitialLoading(true);
      const token = localStorage.getItem('token');

      if (!token) return;

      const response = await fetch(`http://10.250.100.40:5000/api/print-settings/${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (activeTab === 1) {
          setIndividualSettings(data);
        } else {
          setCorporateSettings(data);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const updatePosition = (field: keyof Omit<PrintSettings, 'id' | 'accountType' | 'checkWidth' | 'checkHeight'>, key: keyof PrintPosition, value: number | string) => {
    setCurrentSettings(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [key]: value
      }
    }));
  };

  const updateCheckSize = (key: 'checkWidth' | 'checkHeight', value: number) => {
    setCurrentSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('الرجاء تسجيل الدخول');
        return;
      }

      const response = await fetch('http://10.250.100.40:5000/api/print-settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSettings),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('تم حفظ الإعدادات بنجاح!');
      } else {
        setError(data.error || 'فشل في حفظ الإعدادات');
      }
    } catch (err) {
      setError('فشل في حفظ الإعدادات');
      console.error('Error saving settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات للقيم الافتراضية؟')) {
      setCurrentSettings(activeTab === 1 ? DEFAULT_INDIVIDUAL : DEFAULT_CORPORATE);
      setSuccess('تم إعادة تعيين الإعدادات');
    }
  };

  if (initialLoading) {
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
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">إعدادات الطباعة</h1>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab(1)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 1
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              شيكات الأفراد (25 ورقة)
            </button>
            <button
              onClick={() => setActiveTab(2)}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${activeTab === 2
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              شيكات الشركات (50 ورقة)
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Form */}
          <div className="card space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">
              مواصفات الشيك
            </h2>

            {/* Check Dimensions */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-700">المقاسات (ملم)</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    العرض (الطول)
                  </label>
                  <input
                    type="number"
                    value={currentSettings.checkWidth}
                    onChange={(e) => updateCheckSize('checkWidth', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    الارتفاع
                  </label>
                  <input
                    type="number"
                    value={currentSettings.checkHeight}
                    onChange={(e) => updateCheckSize('checkHeight', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Branch Name Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">اسم الفرع</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X (من اليسار)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.x}
                    onChange={(e) => updatePosition('branchName', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y (من الأعلى)</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.y}
                    onChange={(e) => updatePosition('branchName', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.branchName.fontSize}
                    onChange={(e) => updatePosition('branchName', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.branchName.align}
                    onChange={(e) => updatePosition('branchName', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Serial Number Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">الرقم التسلسلي</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.x}
                    onChange={(e) => updatePosition('serialNumber', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.y}
                    onChange={(e) => updatePosition('serialNumber', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.serialNumber.fontSize}
                    onChange={(e) => updatePosition('serialNumber', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.serialNumber.align}
                    onChange={(e) => updatePosition('serialNumber', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Account Holder Name Position */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-gray-700">اسم صاحب الحساب</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={currentSettings.accountHolderName.x}
                    onChange={(e) => updatePosition('accountHolderName', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={currentSettings.accountHolderName.y}
                    onChange={(e) => updatePosition('accountHolderName', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.accountHolderName.fontSize}
                    onChange={(e) => updatePosition('accountHolderName', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.accountHolderName.align}
                    onChange={(e) => updatePosition('accountHolderName', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* MICR Line Position */}
            <div className="space-y-4 border-t pt-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">خط MICR</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                  <p className="font-medium mb-1">ترتيب البيانات (من اليمين لليسار - RTL):</p>
                  <p className="font-mono text-xs">
                    [نوع الصك: 01 أفراد / 02 شركات] [رقم الحساب 15 رقم] [الرقم التوجيهي] [رقم التسلسل 9 أرقام]
                  </p>
                  <p className="mt-1 font-mono text-xs text-blue-600">
                    مثال: 01 100012345678901 1100000001 000000001
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">X</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.x}
                    onChange={(e) => updatePosition('micrLine', 'x', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Y</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.y}
                    onChange={(e) => updatePosition('micrLine', 'y', parseFloat(e.target.value))}
                    className="input w-full"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">حجم الخط</label>
                  <input
                    type="number"
                    value={currentSettings.micrLine.fontSize}
                    onChange={(e) => updatePosition('micrLine', 'fontSize', parseInt(e.target.value))}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">المحاذاة</label>
                  <select
                    value={currentSettings.micrLine.align}
                    onChange={(e) => updatePosition('micrLine', 'align', e.target.value)}
                    className="input w-full"
                  >
                    <option value="left">يسار</option>
                    <option value="center">وسط</option>
                    <option value="right">يمين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </button>

              <button
                onClick={handleReset}
                className="btn bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                إعادة تعيين
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              معاينة الشيك
            </h2>

            <div
              className="border-2 border-gray-300 bg-white relative overflow-hidden"
              style={{
                width: `${currentSettings.checkWidth * 2}px`,
                height: `${currentSettings.checkHeight * 2}px`,
              }}
            >
              {/* Branch Name */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.branchName.x * 2}px`,
                  top: `${currentSettings.branchName.y * 2}px`,
                  fontSize: `${currentSettings.branchName.fontSize * 1.5}px`,
                  textAlign: currentSettings.branchName.align,
                  transform: currentSettings.branchName.align === 'center' ? 'translateX(-50%)' : 'none',
                }}
              >
                الفرع الرئيسي
              </div>

              {/* Serial Number */}
              <div
                className="absolute"
                style={{
                  left: currentSettings.serialNumber.align === 'right' ? 'auto' : `${currentSettings.serialNumber.x * 2}px`,
                  right: currentSettings.serialNumber.align === 'right' ? `${(currentSettings.checkWidth - currentSettings.serialNumber.x) * 2}px` : 'auto',
                  top: `${currentSettings.serialNumber.y * 2}px`,
                  fontSize: `${currentSettings.serialNumber.fontSize * 1.5}px`,
                  fontFamily: 'monospace',
                }}
              >
                000000001
              </div>

              {/* Account Holder Name */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.accountHolderName.x * 2}px`,
                  top: `${currentSettings.accountHolderName.y * 2}px`,
                  fontSize: `${currentSettings.accountHolderName.fontSize * 1.5}px`,
                  textAlign: currentSettings.accountHolderName.align,
                }}
              >
                أحمد محمد علي السيد
              </div>

              {/* MICR Line */}
              <div
                className="absolute"
                style={{
                  left: `${currentSettings.micrLine.x * 2}px`,
                  top: `${currentSettings.micrLine.y * 2}px`,
                  fontSize: `${currentSettings.micrLine.fontSize * 1.5}px`,
                  fontFamily: 'MICR, monospace',
                  textAlign: currentSettings.micrLine.align,
                  transform: currentSettings.micrLine.align === 'center' ? 'translateX(-50%)' : 'none',
                  letterSpacing: '0.05em',
                }}
              >
                01 100012345678901 1100000001 000000001
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-600 space-y-1">
                <p>• المعاينة بمقياس 2:1 للوضوح</p>
                <p>• المقاسات الفعلية: {currentSettings.checkWidth} × {currentSettings.checkHeight} ملم</p>
                <p>• استخدم الإعدادات لضبط مواضع البيانات بدقة</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                <p className="font-medium text-green-800 mb-1">📋 تكوين خط MICR (من اليمين لليسار):</p>
                <div className="font-mono text-xs text-green-700 space-y-1">
                  <p className="text-right">• <span className="text-green-900 font-bold">01</span> (أفراد) أو <span className="text-green-900 font-bold">02</span> (شركات) - النوع (يمين)</p>
                  <p className="text-right">• <span className="text-green-900 font-bold">100012345678901</span> (15 رقم) - رقم الحساب</p>
                  <p className="text-right">• <span className="text-green-900 font-bold">1100000001</span> - الرقم التوجيهي (رقم الفرع)</p>
                  <p className="text-right">• <span className="text-green-900 font-bold">000000001</span> (9 أرقام) - التسلسل (يسار)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

