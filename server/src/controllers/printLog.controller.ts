import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrintLogService } from '../services/printLog.service';
import { CustomerCategoryService } from '../services/customerCategory.service';
import {
  assertAccountBelongsToUserBranch,
  assertSameBranchCode,
  getUserBranchScope,
  sendBranchError,
} from '../utils/branchAccess';

export class PrintLogController {
  // إنشاء سجل طباعة جديد
  static async createLog(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        accountNumber,
        accountBranch,
        branchName,
        firstChequeNumber,
        lastChequeNumber,
        totalCheques,
        accountType,
        operationType,
        reprintReason,
        notes,
        chequeNumbers,
        customerName,
      } = req.body;

      if (!req.user) {
        res.status(401).json({ error: 'المستخدم غير مصرح' });
        return;
      }

      try {
        await assertAccountBelongsToUserBranch(req.user, accountNumber);
        if (accountBranch) {
          await assertSameBranchCode(req.user, accountBranch);
        }
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      const category = await CustomerCategoryService.resolveFromAccount(String(accountNumber));
      if (!category.found) {
        res.status(400).json({
          error: category.error || 'فئة الحساب غير مسجلة في عدادات الفئات. لا يمكن الطباعة.',
        });
        return;
      }
      const leaves = Number(totalCheques);
      const mismatch = CustomerCategoryService.leavesMismatchMessage(category.typeCode, leaves);
      if (mismatch) {
        res.status(400).json({ error: mismatch });
        return;
      }
      const sentType = accountType != null ? Number(accountType) : undefined;
      if (category.typeCode === '02' && sentType != null && sentType !== 2) {
        res.status(400).json({
          error: `نوع الحساب المرسل (${accountType}) لا يطابق فئة الشركات (02).`,
        });
        return;
      }
      if (category.typeCode === '01' && sentType != null && sentType !== 1 && sentType !== 3) {
        res.status(400).json({
          error: `نوع الحساب المرسل (${accountType}) لا يطابق فئة الأفراد (01).`,
        });
        return;
      }

      const resolvedAccountType =
        sentType ??
        (category.typeCode === '02' ? 2 : leaves === 10 ? 3 : 1);

      // التحقق من وجود سبب إعادة الطباعة عند إعادة الطباعة
      if (operationType === 'reprint' && !reprintReason) {
        res.status(400).json({ 
          error: 'يجب تحديد سبب إعادة الطباعة',
          details: 'الرجاء اختيار سبب إعادة الطباعة: ورقة تالفة أو ورقة لم تطبع'
        });
        return;
      }

      // التحقق من صحة سبب إعادة الطباعة
      if (operationType === 'reprint' && reprintReason && !['damaged', 'not_printed'].includes(reprintReason)) {
        res.status(400).json({ 
          error: 'سبب إعادة الطباعة غير صحيح',
          details: 'يجب أن يكون السبب إما "damaged" (تالفة) أو "not_printed" (لم تطبع)'
        });
        return;
      }

      const printLog = await PrintLogService.createPrintLog({
        accountNumber,
        accountBranch,
        branchName,
        firstChequeNumber,
        lastChequeNumber,
        totalCheques,
        accountType: resolvedAccountType,
        operationType: operationType || 'print',
        reprintReason: reprintReason || undefined,
        printedBy: req.user.userId,
        printedByName: req.user.username,
        notes,
        chequeNumbers,
        customerName,
      });

      console.log('✅ تم إنشاء سجل طباعة:', {
        logId: printLog.id,
        accountNumber,
        operation: operationType,
        cheques: totalCheques,
      });

      res.json(printLog);
    } catch (error: any) {
      console.error('خطأ في إنشاء سجل الطباعة:', error);
      const message = error?.message || 'فشل في إنشاء سجل الطباعة';
      const isInventoryError =
        typeof message === 'string' &&
        (message.includes('مخزون') || message.includes('لا يمكن الطباعة'));
      res.status(isInventoryError ? 400 : 500).json({
        error: message,
        details: message,
      });
    }
  }

  // التحقق من حالة طباعة الشيكات
  static async checkPrintStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, chequeNumbers } = req.body;

      if (!accountNumber || !Array.isArray(chequeNumbers)) {
        res.status(400).json({ error: 'بيانات غير صحيحة' });
        return;
      }

      try {
        await assertAccountBelongsToUserBranch(req.user, accountNumber);
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      const status = await PrintLogService.checkChequesPrintStatus(
        accountNumber,
        chequeNumbers
      );

      res.json(status);
    } catch (error: any) {
      console.error('خطأ في التحقق من حالة الطباعة:', error);
      res.status(500).json({
        error: 'فشل في التحقق من حالة الطباعة',
        details: error.message,
      });
    }
  }

  // جلب جميع السجلات
  static async getAllLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        page,
        limit,
        operationType,
        accountNumber,
        startDate,
        endDate,
        userId,
      } = req.query;

      // التحقق من الصلاحيات: فقط المدير يمكنه فلترة حسب أي مستخدم
      let finalUserId: number | undefined;
      if (userId) {
        if (req.user?.isAdmin) {
          finalUserId = parseInt(userId as string);
        } else {
          // المستخدمون العاديون يمكنهم فقط رؤية سجلاتهم الخاصة
          finalUserId = req.user?.userId;
        }
      }

      let accountBranch: string | undefined;
      try {
        const scope = await getUserBranchScope(req.user!);
        if (!scope.isAdmin) {
          accountBranch = scope.branchNumber;
        }
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      const result = await PrintLogService.getAllLogs({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        operationType: operationType as 'print' | 'reprint' | undefined,
        accountNumber: accountNumber as string | undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        userId: finalUserId,
        accountBranch,
      });

      res.json(result);
    } catch (error: any) {
      console.error('خطأ في جلب السجلات:', error);
      res.status(500).json({
        error: 'فشل في جلب السجلات',
        details: error.message,
      });
    }
  }

  // جلب سجل واحد
  static async getLogById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const log = await PrintLogService.getLogById(parseInt(id));

      if (!log) {
        res.status(404).json({ error: 'السجل غير موجود' });
        return;
      }

      try {
        await assertAccountBelongsToUserBranch(req.user, log.accountNumber);
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }

      res.json(log);
    } catch (error: any) {
      console.error('خطأ في جلب السجل:', error);
      res.status(500).json({
        error: 'فشل في جلب السجل',
        details: error.message,
      });
    }
  }

  // السماح بإعادة الطباعة
  static async allowReprint(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { accountNumber, chequeNumbers } = req.body;

      if (!req.user?.isAdmin) {
        res.status(403).json({ error: 'هذه العملية تتطلب صلاحيات المدير' });
        return;
      }

      await PrintLogService.allowReprintForCheques(accountNumber, chequeNumbers);

      res.json({ message: 'تم السماح بإعادة الطباعة بنجاح' });
    } catch (error: any) {
      console.error('خطأ في السماح بإعادة الطباعة:', error);
      res.status(500).json({
        error: 'فشل في السماح بإعادة الطباعة',
        details: error.message,
      });
    }
  }
}
