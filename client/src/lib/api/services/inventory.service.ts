import { request } from '../client';
import { Inventory, InventoryTransaction, AddInventoryRequest } from '@/types';

export const inventoryService = {
  getAll: async (branchId?: number): Promise<Inventory[]> => {
    const params: Record<string, number> = {};
    if (branchId != null) params.branch_id = branchId;
    return request<Inventory[]>({
      url: '/inventory',
      method: 'GET',
      params,
    });
  },

  getByStockType: async (stockType: 1 | 2 | 3, branchId?: number): Promise<Inventory> => {
    const params: Record<string, number> = {};
    if (branchId != null) params.branch_id = branchId;
    return request<Inventory>({
      url: `/inventory/${stockType}`,
      method: 'GET',
      params,
    });
  },

  addStock: async (data: AddInventoryRequest): Promise<{ message: string }> => {
    return request<{ message: string }>({
      url: '/inventory/add',
      method: 'POST',
      data,
    });
  },

  getTransactionHistory: async (
    stockType?: 1 | 2 | 3,
    limit?: number,
    branchId?: number
  ): Promise<InventoryTransaction[]> => {
    const params: Record<string, number> = {};
    if (stockType !== undefined) params.stock_type = stockType;
    if (limit) params.limit = limit;
    if (branchId != null) params.branch_id = branchId;

    return request<InventoryTransaction[]>({
      url: '/inventory/transactions/history',
      method: 'GET',
      params,
    });
  },

  reverseTransaction: async (id: number): Promise<{ message: string }> => {
    return request<{ message: string }>({
      url: `/inventory/transactions/${id}`,
      method: 'DELETE',
    });
  },

  updateTransaction: async (
    id: number,
    data: { quantity: number; notes?: string }
  ): Promise<{ message: string }> => {
    return request<{ message: string }>({
      url: `/inventory/transactions/${id}`,
      method: 'PUT',
      data,
    });
  },
};
