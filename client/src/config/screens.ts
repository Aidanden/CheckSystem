export const SYSTEM_SCREENS = [
  { name: 'لوحة التحكم', href: '/dashboard' },
  { name: 'طباعة شيك', href: '/print' },
  { name: 'سجلات الطباعة', href: '/print-logs' },
  { name: 'المخزون', href: '/inventory' },
  { name: 'طباعة شيك مصدق', href: '/certified-print' },
  { name: 'طباعة صك مصدق (منظومة)', href: '/certified-instrument' },
  { name: 'سجل طباعة الصك المصدق (منظومة)', href: '/certified-instrument-logs' },
  { name: 'تقارير الشيك المصدقة', href: '/certified-reports' },
  { name: 'إصدار دفاتر مصدقة', href: '/certified-checks' },
  { name: 'سجل و تقارير دفاتر المصدقة', href: '/certified-logs' },
  { name: 'مخزن الشيكات المصدقة', href: '/certified-inventory' },
  { name: 'المستخدمين', href: '/users' },
  { name: 'الفروع', href: '/branches' },
  { name: 'التقارير', href: '/reports' },
  { name: 'إعدادات الطباعة', href: '/settings' },
  { name: 'إعدادات طباعة شيك مصدق', href: '/certified-settings' },
] as const;

export type SystemScreenHref = (typeof SYSTEM_SCREENS)[number]['href'];

export function isScreenHidden(pathname: string, hiddenHrefs: string[]): boolean {
  return hiddenHrefs.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
}
