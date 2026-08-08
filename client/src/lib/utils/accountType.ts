export type AccountTypeCode = 1 | 2 | 3;

interface ResolveAccountTypeInput {
  chequeLeaves?: number | string | null;
  /** عدد أوراق الدفتر الكامل (وليس نطاق إعادة الطباعة المصفّى) */
  chequeCount?: number | string | null;
  /** نوع محفوظ مسبقاً (مثلاً من سجل الطباعة) عند غياب عدد الأوراق */
  fallbackAccountType?: number | string | null;
}

function mapLeavesToAccountType(size: number): AccountTypeCode | null {
  if (size === 10) return 3; // موظف
  if (size === 25) return 1; // فردي
  if (size === 50) return 2; // شركة
  return null;
}

/**
 * يحدد نوع الحساب من عدد أوراق الدفتر:
 * 10 → موظف (3)، 25 → فردي (1)، 50 → شركة (2)
 */
export function resolveAccountType(input: ResolveAccountTypeInput): AccountTypeCode {
  const fromLeaves = mapLeavesToAccountType(Number(input.chequeLeaves));
  if (fromLeaves) return fromLeaves;

  const fromCount = mapLeavesToAccountType(Number(input.chequeCount));
  if (fromCount) return fromCount;

  const fallback = Number(input.fallbackAccountType);
  if (fallback === 1 || fallback === 2 || fallback === 3) {
    return fallback as AccountTypeCode;
  }

  return 1;
}
