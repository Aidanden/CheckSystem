import { request } from '../client';

export interface CertifiedInstrumentLog {
  id: number;
  operationType: 'query' | 'print' | 'reprint';
  txnRefNo: string;
  instrumentNo?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  beneficiaryName?: string | null;
  amount?: number | null;
  currency?: string | null;
  issueDate?: string | null;
  txnBranch?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  routingNumber?: string | null;
  accountingNumber?: string | null;
  amountWords?: string | null;
  performedBy: number;
  performedByName: string;
  createdAt: string;
  notes?: string | null;
}

export interface CertifiedInstrumentLogPayload {
  operationType: 'query' | 'print' | 'reprint';
  txnRefNo: string;
  instrumentNo?: string | null;
  accountNumber?: string | null;
  accountHolderName?: string | null;
  beneficiaryName?: string | null;
  amount?: number | null;
  currency?: string | null;
  issueDate?: string | null;
  txnBranch?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  routingNumber?: string | null;
  accountingNumber?: string | null;
  amountWords?: string | null;
  notes?: string | null;
}

export const certifiedInstrumentLogService = {
  create: async (data: CertifiedInstrumentLogPayload) => {
    return request<CertifiedInstrumentLog>({
      url: '/certified-instrument-logs',
      method: 'POST',
      data,
    });
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    operationType?: 'query' | 'print' | 'reprint';
    accountNumber?: string;
    txnRefNo?: string;
    startDate?: string;
    endDate?: string;
    userId?: number;
    branchId?: number;
  }) => {
    return request<{ logs: CertifiedInstrumentLog[]; total: number }>({
      url: '/certified-instrument-logs',
      method: 'GET',
      params,
    });
  },

  getStatistics: async (params?: {
    operationType?: 'query' | 'print' | 'reprint';
    accountNumber?: string;
    txnRefNo?: string;
    startDate?: string;
    endDate?: string;
    userId?: number;
    branchId?: number;
  }) => {
    return request<{
      total: number;
      queries: number;
      prints: number;
      reprints?: number;
      lastOperationDate: string | null;
    }>({
      url: '/certified-instrument-logs/statistics',
      method: 'GET',
      params,
    });
  },
};
