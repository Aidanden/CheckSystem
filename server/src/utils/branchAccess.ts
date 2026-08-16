import { Response } from 'express';
import { UserModel } from '../models/User.model';

export class BranchAccessDeniedError extends Error {
  status = 403;
  constructor(message: string) {
    super(message);
    this.name = 'BranchAccessDeniedError';
  }
}

export type AuthUserLike = {
  userId: number;
  username?: string;
  isAdmin: boolean;
  branchId?: number;
  branchNumber?: string;
};

export function normalizeBranchCode(code: string | number | null | undefined): string {
  const digits = String(code ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.slice(-3).padStart(3, '0');
}

export function accountBranchFromNumber(accountNumber: string | null | undefined): string {
  return normalizeBranchCode(String(accountNumber ?? '').trim().slice(0, 3));
}

export async function getUserBranchScope(user: AuthUserLike) {
  if (user.isAdmin) {
    return { isAdmin: true as const };
  }

  const details = await UserModel.findByIdWithDetails(user.userId);
  const branchId = details?.branchId ?? user.branchId;
  const branchNumber = normalizeBranchCode(details?.branch?.branchNumber || user.branchNumber);

  if (!branchId || !branchNumber) {
    throw new BranchAccessDeniedError(
      'المستخدم غير مرتبط بفرع. لا يمكن الاستعلام أو الطباعة إلا بعد ربط المستخدم بفرع.'
    );
  }

  return { isAdmin: false as const, branchId, branchNumber };
}

export async function assertSameBranchCode(
  user: AuthUserLike | undefined,
  targetBranch: string | number | null | undefined
): Promise<void> {
  if (!user) {
    throw new BranchAccessDeniedError('المستخدم غير مصرح');
  }
  const scope = await getUserBranchScope(user);
  if (scope.isAdmin) return;

  const target = normalizeBranchCode(targetBranch);
  if (!target) {
    throw new BranchAccessDeniedError('تعذر تحديد فرع العملية. غير مسموح بالمتابعة.');
  }
  if (target !== scope.branchNumber) {
    throw new BranchAccessDeniedError(
      `هذه العملية تتبع فرع ${target}. أنت مخول فقط بعمليات فرع ${scope.branchNumber}. مدير النظام وحده يستطيع العمل على كل الفروع.`
    );
  }
}

export async function assertSameBranchId(
  user: AuthUserLike | undefined,
  targetBranchId: number | string | null | undefined
): Promise<void> {
  if (!user) {
    throw new BranchAccessDeniedError('المستخدم غير مصرح');
  }
  const scope = await getUserBranchScope(user);
  if (scope.isAdmin) return;

  const id = Number(targetBranchId);
  if (!Number.isFinite(id) || id !== scope.branchId) {
    throw new BranchAccessDeniedError(
      `غير مسموح بالوصول لفرع آخر. أنت مخول فقط بفرع ${scope.branchNumber}.`
    );
  }
}

export async function assertAccountBelongsToUserBranch(
  user: AuthUserLike | undefined,
  accountNumber: string | null | undefined
): Promise<void> {
  await assertSameBranchCode(user, accountBranchFromNumber(accountNumber));
}

/** Non-admin: always their branch. Admin: optional requested id. */
export async function resolveForcedBranchId(
  user: AuthUserLike | undefined,
  requestedBranchId?: number
): Promise<number | undefined> {
  if (!user) {
    throw new BranchAccessDeniedError('المستخدم غير مصرح');
  }
  const scope = await getUserBranchScope(user);
  if (scope.isAdmin) {
    return requestedBranchId;
  }
  return scope.branchId;
}

export function sendBranchError(res: Response, error: unknown): boolean {
  if (error instanceof BranchAccessDeniedError) {
    res.status(403).json({ error: error.message });
    return true;
  }
  return false;
}
