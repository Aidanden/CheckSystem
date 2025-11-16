'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
  Home,
  Printer,
  Package,
  Users,
  Building2,
  FileText,
  LogOut,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'لوحة التحكم', href: '/dashboard', icon: Home },
  { name: 'طباعة شيك', href: '/print', icon: Printer },
  { name: 'سجل العمليات', href: '/history', icon: FileText },
  { name: 'المخزون', href: '/inventory', icon: Package },
  { name: 'المستخدمين', href: '/users', icon: Users, adminOnly: true },
  { name: 'الفروع', href: '/branches', icon: Building2, adminOnly: true },
  { name: 'التقارير', href: '/reports', icon: FileText },
  { name: 'إعدادات الطباعة', href: '/settings', icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  const filteredNavigation = navigation.filter(
    (item) => !item.adminOnly || user?.isAdmin
  );

  return (
    <div className="fixed right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-800">نظام الشيكات</h1>
        <p className="text-sm text-gray-500">Check Printing System</p>
      </div>

      <nav className="space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {user && (
        <div className="absolute bottom-4 right-4 left-4">
          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600 mb-3">
              <p className="font-medium">{user.username}</p>
              <p className="text-xs">{user.isAdmin ? 'مسؤول' : 'مستخدم'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

