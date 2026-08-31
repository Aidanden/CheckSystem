import { InventoryModel } from '../models/Inventory.model';
import { Inventory, InventoryTransaction } from '@prisma/client';
import { StockType, AddInventoryRequest } from '../types';

export class InventoryService {
  static async getAllInventory(branchId?: number | null): Promise<Inventory[]> {
    return InventoryModel.findAll(branchId);
  }

  static async getInventoryByStockType(
    stockType: StockType,
    branchId?: number | null
  ): Promise<Inventory> {
    const inventory = await InventoryModel.findByStockType(stockType, branchId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }
    return inventory;
  }

  static async getAvailableQuantity(
    stockType: StockType,
    branchId?: number | null
  ): Promise<number> {
    return InventoryModel.getAvailableQuantity(stockType, branchId);
  }

  static async addInventory(data: AddInventoryRequest, userId: number): Promise<void> {
    if (data.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (data.stock_type !== StockType.CERTIFIED && !data.branch_id) {
      throw new Error('يجب تحديد الفرع عند إضافة مخزون أفراد أو شركات');
    }

    await InventoryModel.addStock(data.stock_type, data.quantity, userId, {
      branchId: data.stock_type === StockType.CERTIFIED ? null : data.branch_id,
      serialFrom: data.serial_from,
      serialTo: data.serial_to,
      notes: data.notes,
    });
  }

  static async deductInventory(
    stockType: StockType,
    quantity: number,
    userId: number,
    notes?: string,
    branchId?: number | null
  ): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const success = await InventoryModel.deductStock(
      stockType,
      quantity,
      userId,
      notes,
      stockType === StockType.CERTIFIED ? null : branchId
    );
    if (!success) {
      throw new Error('Insufficient inventory');
    }
  }

  static async getTransactionHistory(options?: {
    stockType?: StockType;
    branchId?: number | null;
    limit?: number;
  }): Promise<InventoryTransaction[]> {
    return InventoryModel.getTransactionHistory({
      stockType: options?.stockType,
      branchId: options?.branchId,
      limit: options?.limit ?? 100,
    });
  }

  static async reverseTransaction(id: number, userId: number): Promise<void> {
    await InventoryModel.reverseTransaction(id, userId);
  }

  static async updateAddTransaction(
    id: number,
    quantity: number,
    userId: number,
    notes?: string
  ): Promise<void> {
    await InventoryModel.updateAddTransaction(id, quantity, userId, notes);
  }

  static async checkAvailability(
    stockType: StockType,
    requiredQuantity: number,
    branchId?: number | null
  ): Promise<boolean> {
    const available = await InventoryModel.getAvailableQuantity(stockType, branchId);
    return available >= requiredQuantity;
  }
}
