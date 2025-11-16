'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCurrentUser } from '@/store/slices/authSlice';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, token, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else if (token && !user) {
      dispatch(fetchCurrentUser());
    }
  }, [token, user, router, dispatch]);

  if (!isAuthenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="mr-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

