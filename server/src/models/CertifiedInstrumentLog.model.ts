import prisma from '../lib/prisma';

/** Prisma model: CertifiedInstrumentLog */
export interface CreateInstrumentLogData {
  operationType: 'query' | 'print';
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
  notes?: string | null;
}

export interface InstrumentLogFilters {
  page?: number;
  limit?: number;
  operationType?: 'query' | 'print';
  accountNumber?: string;
  txnRefNo?: string;
  startDate?: string;
  endDate?: string;
  userId?: number;
  branchId?: number;
}

export class CertifiedInstrumentLogModel {
  static async create(data: CreateInstrumentLogData) {
    return prisma.certifiedInstrumentLog.create({
      data: {
        operationType: data.operationType,
        txnRefNo: data.txnRefNo,
        instrumentNo: data.instrumentNo ?? null,
        accountNumber: data.accountNumber ?? null,
        accountHolderName: data.accountHolderName ?? null,
        beneficiaryName: data.beneficiaryName ?? null,
        amount: data.amount ?? null,
        currency: data.currency ?? null,
        issueDate: data.issueDate ?? null,
        txnBranch: data.txnBranch ?? null,
        branchId: data.branchId ?? null,
        branchName: data.branchName ?? null,
        routingNumber: data.routingNumber ?? null,
        accountingNumber: data.accountingNumber ?? null,
        amountWords: data.amountWords ?? null,
        performedBy: data.performedBy,
        performedByName: data.performedByName,
        notes: data.notes ?? null,
      },
    });
  }

  static async findAll(filters: InstrumentLogFilters = {}) {
    const page = Math.max(0, filters.page ?? 0);
    const limit = Math.min(200, Math.max(1, filters.limit ?? 20));
    const where: any = {};

    if (filters.operationType) where.operationType = filters.operationType;
    if (filters.accountNumber) {
      where.accountNumber = { contains: filters.accountNumber.trim() };
    }
    if (filters.txnRefNo) {
      where.txnRefNo = { contains: filters.txnRefNo.trim() };
    }
    if (filters.userId) where.performedBy = filters.userId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.certifiedInstrumentLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: page * limit,
        take: limit,
      }),
      prisma.certifiedInstrumentLog.count({ where }),
    ]);

    return { logs, total };
  }

  static async getStatistics(filters: Omit<InstrumentLogFilters, 'page' | 'limit'> = {}) {
    const where: any = {};
    if (filters.operationType) where.operationType = filters.operationType;
    if (filters.accountNumber) where.accountNumber = { contains: filters.accountNumber.trim() };
    if (filters.txnRefNo) where.txnRefNo = { contains: filters.txnRefNo.trim() };
    if (filters.userId) where.performedBy = filters.userId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, queries, prints, last] = await Promise.all([
      prisma.certifiedInstrumentLog.count({ where }),
      prisma.certifiedInstrumentLog.count({ where: { ...where, operationType: 'query' } }),
      prisma.certifiedInstrumentLog.count({ where: { ...where, operationType: 'print' } }),
      prisma.certifiedInstrumentLog.findFirst({
        where,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      total,
      queries,
      prints,
      lastOperationDate: last?.createdAt ?? null,
    };
  }
}
