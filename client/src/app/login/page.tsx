'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, clearError } from '@/store/slices/authSlice';
import Image from 'next/image';
import { SYSTEM_SCREENS } from '@/config/screens';
import { systemSettingsService } from '@/lib/api';
import { useHiddenScreens } from '@/lib/hooks/useHiddenScreens';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error } = useAppSelector((state) => state.auth);
  const { refresh } = useHiddenScreens();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showUnlock, setShowUnlock] = useState(false);
  const [showScreens, setShowScreens] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [selectedHidden, setSelectedHidden] = useState<string[]>([]);
  const [savingScreens, setSavingScreens] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      return;
    }

    try {
      await dispatch(login({ username, password })).unwrap();
    } catch (err) {
      // Error is handled by Redux
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setSaveMessage('');
    try {
      const current = await systemSettingsService.unlockHiddenScreens(unlockPassword);
      setSelectedHidden(current.hiddenScreens);
      setShowUnlock(false);
      setShowScreens(true);
    } catch (err: any) {
      setUnlockError(err?.response?.data?.error || 'كلمة المرور غير صحيحة');
    }
  };

  const toggleScreen = (href: string) => {
    setSelectedHidden((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    );
  };

  const handleSaveScreens = async () => {
    setSavingScreens(true);
    setSaveMessage('');
    setUnlockError('');
    try {
      await systemSettingsService.updateHiddenScreens(unlockPassword, selectedHidden);
      await refresh();
      setSaveMessage('تم حفظ إعدادات الشاشات على النظام');
    } catch (err: any) {
      setUnlockError(err?.response?.data?.error || 'فشل حفظ الإعدادات');
    } finally {
      setSavingScreens(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 via-white to-primary-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <Image
                src="/images/AIIB.png"
                alt="مصرف الاستثمار العربي الاسلامي"
                width={120}
                height={120}
                className="w-28 h-28"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            مصرف الاستثمار العربي الإسلامي
          </h1>
          <p className="text-lg text-primary-600 font-semibold mb-1">
            نظام طباعة الشيكات
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-400 mx-auto rounded-full"></div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-r-4 border-red-500 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                اسم المستخدم
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="أدخل اسم المستخدم"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="أدخل كلمة المرور"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setUnlockPassword('');
              setUnlockError('');
              setShowUnlock(true);
            }}
            className="mt-4 w-full text-sm text-gray-500 hover:text-primary-600"
          >
            إعدادات متقدمة
          </button>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p className="mb-1">جميع الحقوق محفوظة © 2025</p>
          <p className="font-semibold text-primary-600">
            شركة التقنية الحديثة - MTC
          </p>
        </div>
      </div>

      {showUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">إعدادات متقدمة</h2>
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="أدخل كلمة مرور الإعدادات"
                  autoFocus
                />
              </div>
              {unlockError && <p className="text-sm text-red-600">{unlockError}</p>}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-xl font-semibold">
                  فتح
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnlock(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScreens && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-1">التحكم في الشاشات</h2>
            <p className="text-sm text-gray-500 mb-4">
              الشاشة المحددة تُخفى من النظام بالكامل (القائمة والوصول المباشر)، وليس من هذا المتصفح فقط.
            </p>
            <div className="space-y-2">
              {SYSTEM_SCREENS.map((screen) => (
                <label
                  key={screen.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedHidden.includes(screen.href)}
                    onChange={() => toggleScreen(screen.href)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-800">{screen.name}</span>
                </label>
              ))}
            </div>
            {saveMessage && <p className="text-sm text-green-600 mt-3">{saveMessage}</p>}
            {unlockError && <p className="text-sm text-red-600 mt-3">{unlockError}</p>}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleSaveScreens}
                disabled={savingScreens}
                className="flex-1 bg-primary-600 text-white py-2 rounded-xl font-semibold disabled:opacity-50"
              >
                {savingScreens ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowScreens(false);
                  setUnlockPassword('');
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-semibold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
