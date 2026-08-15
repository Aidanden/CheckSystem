'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';
import { useHiddenScreens } from '@/lib/hooks/useHiddenScreens';
import { SYSTEM_SCREENS, isScreenHidden, requiredPermissionForPath } from '@/config/screens';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, token, user } = useAppSelector((state) => state.auth);
  const pathname = usePathname();
  const { hiddenScreens } = useHiddenScreens();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, router, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || loading || !user) return;
    if (isScreenHidden(pathname, hiddenScreens)) {
      const fallback = SYSTEM_SCREENS.find((screen) => !hiddenScreens.includes(screen.href));
      router.replace(fallback?.href || '/login');
      return;
    }

    if (user.isAdmin) return;
    const required = requiredPermissionForPath(pathname);
    if (!required) return;
    const allowed = (user.permissions || []).some((p) => p.permissionCode === required);
    if (!allowed) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, pathname, hiddenScreens, router, user]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-secondary-50">
      <Sidebar />
      <div className="mr-72">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

