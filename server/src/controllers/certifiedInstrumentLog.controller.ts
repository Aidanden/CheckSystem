import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CertifiedInstrumentLogService } from '../services/certifiedInstrumentLog.service';

export class CertifiedInstrumentLogController {
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'المستخدم غير مصرح' });
        return;
      }

      const {
        operationType,
        txnRefNo,
        instrumentNo,
        accountNumber,
        accountHolderName,
        beneficiaryName,
        amount,
        currency,
        issueDate,
        txnBranch,
        branchId,
        branchName,
        routingNumber,
        accountingNumber,
        amountWords,
        notes,
      } = req.body;

      if (!txnRefNo || typeof txnRefNo !== 'string') {
        res.status(400).json({ error: 'الرقم المرجعي مطلوب' });
        return;
      }

      if (!['query', 'print'].includes(operationType)) {
        res.status(400).json({ error: 'نوع العملية غير صالح' });
        return;
      }

      const log = await CertifiedInstrumentLogService.create({
        operationType,
        txnRefNo: txnRefNo.trim(),
        instrumentNo,
        accountNumber,
        accountHolderName,
        beneficiaryName,
        amount: amount != null ? Number(amount) : null,
        currency,
        issueDate,
        txnBranch,
        branchId: branchId != null ? Number(branchId) : null,
        branchName,
        routingNumber,
        accountingNumber,
        amountWords,
        notes,
        performedBy: req.user.userId,
        performedByName: req.user.username,
      });

      res.json(log);
    } catch (error: any) {
      console.error('خطأ في تسجيل عملية الصك المصدق:', error);
      res.status(500).json({ error: error?.message || 'فشل تسجيل العملية' });
    }
  }

  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 0;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
      const result = await CertifiedInstrumentLogService.findAll({
        page,
        limit,
        operationType: req.query.operationType as 'query' | 'print' | undefined,
        accountNumber: req.query.accountNumber as string | undefined,
        txnRefNo: req.query.txnRefNo as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        userId: req.query.userId ? parseInt(String(req.query.userId), 10) : undefined,
        branchId: req.query.branchId ? parseInt(String(req.query.branchId), 10) : undefined,
      });
      res.json(result);
    } catch (error: any) {
      console.error('خطأ في جلب سجلات الصكوك المصدقة:', error);
      res.status(500).json({ error: 'فشل جلب السجلات' });
    }
  }

  static async getStatistics(req: AuthRequest, res: Response): Promise<void> {
    try {
      const stats = await CertifiedInstrumentLogService.getStatistics({
        operationType: req.query.operationType as 'query' | 'print' | undefined,
        accountNumber: req.query.accountNumber as string | undefined,
        txnRefNo: req.query.txnRefNo as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        userId: req.query.userId ? parseInt(String(req.query.userId), 10) : undefined,
        branchId: req.query.branchId ? parseInt(String(req.query.branchId), 10) : undefined,
      });
      res.json(stats);
    } catch (error: any) {
      console.error('خطأ في إحصائيات الصكوك المصدقة:', error);
      res.status(500).json({ error: 'فشل جلب الإحصائيات' });
    }
  }
}
