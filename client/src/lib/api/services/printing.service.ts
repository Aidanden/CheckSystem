import { request } from '../client';
import { PrintCheckbookRequest, PrintCheckbookResponse, PrintOperation, PrintStatistics } from '@/types';

export const printingService = {
  // Print checkbook
  printCheckbook: async (data: PrintCheckbookRequest): Promise<PrintCheckbookResponse> => {
    return request<PrintCheckbookResponse>({
      url: '/printing/print',
      method: 'POST',
      data,
    });
  },

  // Get print history
  getHistory: async (branchId?: number, limit?: number): Promise<PrintOperation[]> => {
    const params: any = {};
    if (branchId !== undefined) params.branch_id = branchId;
    if (limit) params.limit = limit;

    return request<PrintOperation[]>({
      url: '/printing/history',
      method: 'GET',
      params,
    });
  },

  // Get statistics
  getStatistics: async (branchId?: number): Promise<PrintStatistics> => {
    const params: any = {};
    if (branchId !== undefined) params.branch_id = branchId;

    return request<PrintStatistics>({
      url: '/printing/statistics',
      method: 'GET',
      params,
    });
  },
};

