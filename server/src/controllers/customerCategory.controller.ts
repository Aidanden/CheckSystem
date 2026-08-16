import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { CustomerCategoryService } from '../services/customerCategory.service';
import { assertAccountBelongsToUserBranch, sendBranchError } from '../utils/branchAccess';

function normalizeCode(value: unknown) {
  return String(value ?? '').replace(/\D/g, '').padStart(3, '0').slice(-3);
}

function normalizeType(value: unknown) {
  const raw = String(value ?? '').replace(/\D/g, '');
  if (raw === '2' || raw === '02') return '02';
  if (raw === '1' || raw === '01') return '01';
  return '';
}

export class CustomerCategoryController {
  static async getAll(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const categories = await CustomerCategoryService.findAll();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'فشل جلب الفئات' });
    }
  }

  static async resolve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const accountNumber = String(req.query.accountNumber || req.params.accountNumber || '');
      if (!accountNumber.trim()) {
        res.status(400).json({ error: 'رقم الحساب مطلوب' });
        return;
      }
      try {
        await assertAccountBelongsToUserBranch(req.user, accountNumber.trim());
      } catch (err) {
        if (sendBranchError(res, err)) return;
        throw err;
      }
      const result = await CustomerCategoryService.resolveFromAccount(accountNumber.trim());
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'فشل تحديد فئة الحساب' });
    }
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const categoryCode = normalizeCode(req.body.categoryCode);
      const typeCode = normalizeType(req.body.typeCode);
      const description = String(req.body.description || '').trim();

      if (!categoryCode || categoryCode === '000') {
        res.status(400).json({ error: 'رمز الفئة يجب أن يكون 3 أرقام' });
        return;
      }
      if (!typeCode) {
        res.status(400).json({ error: 'النوع يجب أن يكون 01 (أفراد) أو 02 (شركات)' });
        return;
      }
      if (!description) {
        res.status(400).json({ error: 'الوصف مطلوب' });
        return;
      }

      const category = await CustomerCategoryService.create({
        categoryCode,
        description,
        typeCode,
        isActive: req.body.isActive !== false,
      });
      res.status(201).json(category);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(400).json({ error: 'رمز الفئة موجود مسبقاً' });
        return;
      }
      res.status(500).json({ error: error?.message || 'فشل إضافة الفئة' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      const data: any = {};
      if (req.body.categoryCode != null) data.categoryCode = normalizeCode(req.body.categoryCode);
      if (req.body.typeCode != null) {
        const typeCode = normalizeType(req.body.typeCode);
        if (!typeCode) {
          res.status(400).json({ error: 'النوع يجب أن يكون 01 (أفراد) أو 02 (شركات)' });
          return;
        }
        data.typeCode = typeCode;
      }
      if (req.body.description != null) data.description = String(req.body.description).trim();
      if (req.body.isActive != null) data.isActive = Boolean(req.body.isActive);

      const category = await CustomerCategoryService.update(id, data);
      res.json(category);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(400).json({ error: 'رمز الفئة موجود مسبقاً' });
        return;
      }
      res.status(500).json({ error: error?.message || 'فشل تعديل الفئة' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      await CustomerCategoryService.delete(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || 'فشل حذف الفئة' });
    }
  }
}
