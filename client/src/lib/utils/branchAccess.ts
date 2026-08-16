export function normalizeBranchCode(code?: string | number | null): string {
  const digits = String(code ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-3).padStart(3, '0');
}

export function userBranchCode(user?: {
  isAdmin?: boolean;
  branchId?: number;
  branch?: { branchNumber?: string } | null;
} | null): string | null {
  if (!user || user.isAdmin) return null;
  return normalizeBranchCode(user.branch?.branchNumber) || null;
}

export function assertClientSameBranch(
  user: { isAdmin?: boolean; branch?: { branchNumber?: string } | null } | null | undefined,
  targetBranch: string | number | null | undefined
): string | null {
  const mine = userBranchCode(user);
  if (mine == null) {
    if (user && !user.isAdmin) {
      return 'المستخدم غير مرتبط بفرع. لا يمكن الاستعلام أو الطباعة.';
    }
    return null;
  }
  const target = normalizeBranchCode(targetBranch);
  if (!target) {
    return 'تعذر تحديد فرع العملية. غير مسموح بالمتابعة.';
  }
  if (target !== mine) {
    return `هذه العملية تتبع فرع ${target}. أنت مخول فقط بفرع ${mine}. مدير النظام وحده يستطيع العمل على كل الفروع.`;
  }
  return null;
}
