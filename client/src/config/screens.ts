export const SYSTEM_SCREENS = [
  { name: 'لوحة التحكم', href: '/dashboard' },
  { name: 'طباعة شيك', href: '/print', permission: 'SCREEN_PRINT' },
  { name: 'سجلات الطباعة', href: '/print-logs', permission: 'SCREEN_PRINT_LOGS' },
  { name: 'المخزون', href: '/inventory', permission: 'INVENTORY_MANAGEMENT' },
  { name: 'طباعة شيك مصدق', href: '/certified-print', permission: 'SCREEN_CERTIFIED_PRINT' },
  { name: 'طباعة صك مصدق (منظومة)', href: '/certified-instrument', permission: 'SCREEN_CERTIFIED_INSTRUMENT' },
  { name: 'سجل طباعة الصك المصدق (منظومة)', href: '/certified-instrument-logs', permission: 'SCREEN_CERTIFIED_INSTRUMENT_LOGS' },
  { name: 'تقارير الشيك المصدقة', href: '/certified-reports', permission: 'SCREEN_CERTIFIED_REPORTS' },
  { name: 'إصدار دفاتر مصدقة', href: '/certified-checks', permission: 'SCREEN_CERTIFIED_BOOKS' },
  { name: 'سجل و تقارير دفاتر المصدقة', href: '/certified-logs', permission: 'SCREEN_CERTIFIED_LOGS' },
  { name: 'مخزن الشيكات المصدقة', href: '/certified-inventory', permission: 'CERTIFIED_INVENTORY_MANAGEMENT' },
  { name: 'المستخدمين', href: '/users', permission: 'MANAGE_USERS' },
  { name: 'الفروع', href: '/branches', permission: 'MANAGE_BRANCHES' },
  { name: 'التقارير', href: '/reports', permission: 'SCREEN_REPORTS' },
  { name: 'إعدادات الطباعة', href: '/settings', permission: 'SYSTEM_SETTINGS' },
  { name: 'إعدادات طباعة شيك مصدق', href: '/certified-settings', permission: 'SYSTEM_SETTINGS' },
  { name: 'عدادات الفئات', href: '/category-settings', permission: 'SCREEN_CATEGORY_SETTINGS' },
] as const;

export type SystemScreenHref = (typeof SYSTEM_SCREENS)[number]['href'];

export function isScreenHidden(pathname: string, hiddenHrefs: string[]): boolean {
  return hiddenHrefs.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
}

export function requiredPermissionForPath(pathname: string): string | undefined {
  const match = SYSTEM_SCREENS.find(
    (screen) => pathname === screen.href || pathname.startsWith(`${screen.href}/`)
  );
  if (!match || !('permission' in match)) return undefined;
  return match.permission;
}
