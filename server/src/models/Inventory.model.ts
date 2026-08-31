import prisma from '../lib/prisma';
import { Inventory, InventoryTransaction, Prisma } from '@prisma/client';

type InventoryWithBranch = Inventory & {
  branch?: { id: number; branchName: string; branchNumber: string } | null;
};

type TransactionWithBranch = InventoryTransaction & {
  branch?: { id: number; branchName: string; branchNumber: string } | null;
  user?: { id: number; username: string } | null;
};

export class InventoryModel {
  static async ensureBranchStockRows(branchId: number): Promise<void> {
    for (const stockType of [1, 2]) {
      await prisma.inventory.upsert({
        where: {
          branchId_stockType: { branchId, stockType },
        },
        update: {},
        create: { branchId, stockType, quantity: 0 },
      });
    }
  }

  static async ensureCertifiedRow(): Promise<void> {
    const existing = await prisma.inventory.findFirst({
      where: { stockType: 3, branchId: null },
    });
    if (!existing) {
      await prisma.inventory.create({
        data: { stockType: 3, branchId: null, quantity: 0 },
      });
    }
  }

  static async ensureAllBranchRows(): Promise<void> {
    const branches = await prisma.branch.findMany({ select: { id: true } });
    for (const branch of branches) {
      await this.ensureBranchStockRows(branch.id);
    }
    await this.ensureCertifiedRow();
  }

  static async findAll(branchId?: number | null): Promise<InventoryWithBranch[]> {
    await this.ensureAllBranchRows();
    const where: Prisma.InventoryWhereInput = {};
    if (branchId != null) {
      where.OR = [{ branchId }, { stockType: 3, branchId: null }];
    }
    return prisma.inventory.findMany({
      where,
      include: {
        branch: { select: { id: true, branchName: true, branchNumber: true } },
      },
      orderBy: [{ branchId: 'asc' }, { stockType: 'asc' }],
    });
  }

  static async findByStockType(
    stockType: number,
    branchId?: number | null
  ): Promise<InventoryWithBranch | null> {
    if (stockType === 3) {
      await this.ensureCertifiedRow();
      return prisma.inventory.findFirst({
        where: { stockType: 3, branchId: null },
        include: {
          branch: { select: { id: true, branchName: true, branchNumber: true } },
        },
      });
    }
    if (!branchId) return null;
    await this.ensureBranchStockRows(branchId);
    return prisma.inventory.findUnique({
      where: { branchId_stockType: { branchId, stockType } },
      include: {
        branch: { select: { id: true, branchName: true, branchNumber: true } },
      },
    });
  }

  static async getAvailableQuantity(stockType: number, branchId?: number | null): Promise<number> {
    const inventory = await this.findByStockType(stockType, branchId);
    return inventory?.quantity || 0;
  }

  static async addStock(
    stockType: number,
    quantity: number,
    userId: number,
    options?: {
      branchId?: number | null;
      serialFrom?: string;
      serialTo?: string;
      notes?: string;
    }
  ): Promise<void> {
    const branchId = stockType === 3 ? null : options?.branchId;
    if (stockType !== 3 && !branchId) {
      throw new Error('يجب تحديد الفرع عند إضافة مخزون أفراد أو شركات');
    }

    await prisma.$transaction(async (tx) => {
      if (stockType === 3) {
        const row = await tx.inventory.findFirst({ where: { stockType: 3, branchId: null } });
        if (!row) {
          await tx.inventory.create({ data: { stockType: 3, branchId: null, quantity } });
        } else {
          await tx.inventory.update({
            where: { id: row.id },
            data: { quantity: { increment: quantity } },
          });
        }
      } else {
        await tx.inventory.upsert({
          where: { branchId_stockType: { branchId: branchId!, stockType } },
          update: { quantity: { increment: quantity } },
          create: { branchId: branchId!, stockType, quantity },
        });
      }

      await tx.inventoryTransaction.create({
        data: {
          stockType,
          transactionType: 'ADD',
          quantity,
          serialFrom: options?.serialFrom,
          serialTo: options?.serialTo,
          userId,
          branchId,
          notes: options?.notes,
        },
      });
    });
  }

  static async deductStock(
    stockType: number,
    quantity: number,
    userId: number,
    notes?: string,
    branchId?: number | null
  ): Promise<boolean> {
    try {
      const scopeBranchId = stockType === 3 ? null : branchId;
      if (stockType !== 3 && !scopeBranchId) {
        throw new Error('يجب تحديد الفرع عند خصم مخزون أفراد أو شركات');
      }

      await prisma.$transaction(async (tx) => {
        const inventory =
          stockType === 3
            ? await tx.inventory.findFirst({
                where: { stockType: 3, branchId: null },
                select: { id: true, quantity: true },
              })
            : await tx.inventory.findUnique({
                where: { branchId_stockType: { branchId: scopeBranchId!, stockType } },
                select: { id: true, quantity: true },
              });

        const currentQuantity = inventory?.quantity || 0;
        if (!inventory || currentQuantity < quantity) {
          throw new Error('Insufficient inventory');
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: quantity } },
        });

        await tx.inventoryTransaction.create({
          data: {
            stockType,
            transactionType: 'DEDUCT',
            quantity,
            userId,
            branchId: scopeBranchId,
            notes,
          },
        });
      });

      return true;
    } catch {
      return false;
    }
  }

  static async getTransactionById(id: number): Promise<InventoryTransaction | null> {
    return prisma.inventoryTransaction.findUnique({ where: { id } });
  }

  static async reverseTransaction(id: number, _userId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({ where: { id } });
      if (!transaction) {
        throw new Error('عملية المخزون غير موجودة');
      }

      const inventory =
        transaction.stockType === 3
          ? await tx.inventory.findFirst({
              where: { stockType: 3, branchId: null },
              select: { id: true, quantity: true },
            })
          : await tx.inventory.findFirst({
              where: {
                stockType: transaction.stockType,
                branchId: transaction.branchId,
              },
              select: { id: true, quantity: true },
            });

      if (!inventory) {
        throw new Error('سجل المخزون غير موجود لهذا الفرع/النوع');
      }

      if (transaction.transactionType === 'ADD') {
        if (inventory.quantity < transaction.quantity) {
          throw new Error(
            `لا يمكن إلغاء الإضافة: الكمية الحالية (${inventory.quantity}) أقل من كمية العملية (${transaction.quantity}). قد تكون طُبعت أوراق بعد الإضافة.`
          );
        }
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: transaction.quantity } },
        });
      } else if (transaction.transactionType === 'DEDUCT') {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { increment: transaction.quantity } },
        });
      } else {
        throw new Error('نوع العملية غير مدعوم للإلغاء');
      }

      await tx.inventoryTransaction.delete({ where: { id } });
    });
  }

  static async updateAddTransaction(
    id: number,
    newQuantity: number,
    userId: number,
    notes?: string
  ): Promise<void> {
    if (!Number.isInteger(newQuantity) || newQuantity < 1) {
      throw new Error('الكمية يجب أن تكون عدداً صحيحاً أكبر من صفر');
    }

    await prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.findUnique({ where: { id } });
      if (!transaction) {
        throw new Error('عملية المخزون غير موجودة');
      }
      if (transaction.transactionType !== 'ADD') {
        throw new Error('يمكن تعديل عمليات الإضافة فقط. لإلغاء الخصم استخدم زر الإلغاء.');
      }

      const diff = newQuantity - transaction.quantity;
      if (diff === 0) {
        if (notes !== undefined) {
          await tx.inventoryTransaction.update({
            where: { id },
            data: { notes: notes || transaction.notes },
          });
        }
        return;
      }

      const inventory =
        transaction.stockType === 3
          ? await tx.inventory.findFirst({
              where: { stockType: 3, branchId: null },
              select: { id: true, quantity: true },
            })
          : await tx.inventory.findFirst({
              where: {
                stockType: transaction.stockType,
                branchId: transaction.branchId,
              },
              select: { id: true, quantity: true },
            });

      if (!inventory) {
        throw new Error('سجل المخزون غير موجود لهذا الفرع/النوع');
      }

      if (diff < 0 && inventory.quantity < Math.abs(diff)) {
        throw new Error(
          `لا يمكن تقليل الكمية: المتاح حالياً ${inventory.quantity} ورقة، والمطلوب خصم ${Math.abs(diff)}.`
        );
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: diff > 0 ? { increment: diff } : { decrement: Math.abs(diff) },
        },
      });

      await tx.inventoryTransaction.update({
        where: { id },
        data: {
          quantity: newQuantity,
          notes:
            notes?.trim() ||
            `${transaction.notes || ''} | تعديل من ${transaction.quantity} إلى ${newQuantity} بواسطة المستخدم #${userId}`.trim(),
        },
      });
    });
  }

  static async getTransactionHistory(options?: {
    stockType?: number;
    branchId?: number | null;
    limit?: number;
  }): Promise<TransactionWithBranch[]> {
    const limit = options?.limit ?? 100;
    const where: Prisma.InventoryTransactionWhereInput = {};
    if (options?.stockType !== undefined) where.stockType = options.stockType;
    if (options?.branchId != null) {
      if (options?.stockType === 3) {
        where.branchId = null;
      } else {
        where.branchId = options.branchId;
      }
    }

    return prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        branch: { select: { id: true, branchName: true, branchNumber: true } },
        user: { select: { id: true, username: true } },
      },
    });
  }
}
