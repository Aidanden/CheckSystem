import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InventoryService } from '../services/inventory.service';
import { AddInventoryRequest, StockType } from '../types';
import { resolveForcedBranchId } from '../utils/branchAccess';

function parseOptionalBranchId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export class InventoryController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return;
      }

      const requested = parseOptionalBranchId(req.query.branch_id);
      const branchId = await resolveForcedBranchId(req.user, requested);
      const inventory = await InventoryService.getAllInventory(branchId ?? null);
      res.json(inventory);
    } catch (error) {
      if (error instanceof Error) {
        const status = (error as any).status || 500;
        res.status(status).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch inventory' });
      }
    }
  }

  static async getByStockType(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return;
      }

      const stockType = parseInt(req.params.stockType) as StockType;
      const requested = parseOptionalBranchId(req.query.branch_id);
      const branchId =
        stockType === StockType.CERTIFIED
          ? null
          : await resolveForcedBranchId(req.user, requested);

      if (stockType !== StockType.CERTIFIED && !branchId) {
        res.status(400).json({ error: 'يجب تحديد الفرع' });
        return;
      }

      const inventory = await InventoryService.getInventoryByStockType(stockType, branchId);
      res.json(inventory);
    } catch (error) {
      if (error instanceof Error) {
        const status = (error as any).status || 404;
        res.status(status).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to fetch inventory' });
      }
    }
  }

  static async addStock(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return;
      }

      const data: AddInventoryRequest = { ...req.body };
      if (data.stock_type !== StockType.CERTIFIED) {
        const forced = await resolveForcedBranchId(req.user, data.branch_id);
        if (!forced) {
          res.status(400).json({ error: 'يجب تحديد الفرع عند إضافة مخزون أفراد أو شركات' });
          return;
        }
        data.branch_id = forced;
      } else {
        data.branch_id = undefined;
      }

      await InventoryService.addInventory(data, req.user.userId);

      res.status(201).json({
        message: 'تمت إضافة المخزون بنجاح',
        stock_type: data.stock_type,
        quantity: data.quantity,
        branch_id: data.branch_id ?? null,
      });
    } catch (error) {
      if (error instanceof Error) {
        const status = (error as any).status || 400;
        res.status(status).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'فشل إضافة المخزون' });
      }
    }
  }

  static async getTransactionHistory(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return;
      }

      const stockType = req.query.stock_type
        ? (parseInt(req.query.stock_type as string) as StockType)
        : undefined;
      const limit = req.query.limit
        ? Math.min(10000, parseInt(req.query.limit as string))
        : 100;
      const requested = parseOptionalBranchId(req.query.branch_id);
      const branchId =
        stockType === StockType.CERTIFIED
          ? null
          : await resolveForcedBranchId(req.user, requested);

      const transactions = await InventoryService.getTransactionHistory({
        stockType,
        branchId: branchId ?? null,
        limit,
      });
      res.json(transactions);
    } catch (error) {
      if (error instanceof Error) {
        const status = (error as any).status || 500;
        res.status(status).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'فشل جلب سجل المخزون' });
      }
    }
  }

  static async reverseTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return;
      }
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'معرف العملية غير صالح' });
        return;
      }
      await InventoryService.reverseTransaction(id, req.user.userId);
      res.json({ message: 'تم إلغاء العملية وتعديل المخزون بنجاح' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'فشل إلغاء عملية المخزون' });
      }
    }
  }

  static async updateTransaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'غير مصرح' });
        return;
      }
      const id = parseInt(req.params.id, 10);
      const quantity = Number(req.body.quantity);
      const notes = typeof req.body.notes === 'string' ? req.body.notes : undefined;
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'معرف العملية غير صالح' });
        return;
      }
      await InventoryService.updateAddTransaction(id, quantity, req.user.userId, notes);
      res.json({ message: 'تم تعديل عملية الإضافة بنجاح' });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'فشل تعديل عملية المخزون' });
      }
    }
  }
}
