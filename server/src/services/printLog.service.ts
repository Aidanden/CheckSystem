import { PrintLogModel, CreatePrintLogData } from '../models/PrintLog.model';

export class PrintLogService {
  static async createPrintLog(data: CreatePrintLogData) {
    return PrintLogModel.create(data);
  }

  static async checkChequesPrintStatus(accountNumber: string, chequeNumbers: number[]) {
    return PrintLogModel.checkPrintedCheques(accountNumber, chequeNumbers);
  }

  static async getAllLogs(options?: {
    page?: number;
    limit?: number;
    operationType?: 'print' | 'reprint';
    accountNumber?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const startDate = options?.startDate ? new Date(options.startDate) : undefined;
    const endDate = options?.endDate ? new Date(options.endDate) : undefined;

    return PrintLogModel.findAll({
      skip,
      take: limit,
      operationType: options?.operationType,
      accountNumber: options?.accountNumber,
      startDate,
      endDate,
    });
  }

  static async getLogById(id: number) {
    return PrintLogModel.findById(id);
  }

  static async allowReprintForCheques(accountNumber: string, chequeNumbers: number[]) {
    return PrintLogModel.allowReprint(accountNumber, chequeNumbers);
  }
}
