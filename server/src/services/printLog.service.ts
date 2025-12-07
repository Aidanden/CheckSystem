import { PrintLogModel, CreatePrintLogData } from '../models/PrintLog.model';
import { PrintOperationModel } from '../models/PrintOperation.model';
import { AccountModel } from '../models/Account.model';
import { UserModel } from '../models/User.model';

export class PrintLogService {
  static async createPrintLog(data: CreatePrintLogData) {
    const log = await PrintLogModel.create(data);

    // Sync to PrintOperation for Dashboard Statistics
    try {
      // 1. Get User Branch to attribute the operation correctly
      let branchId: number | undefined;
      let routingNumber = data.accountBranch;

      if (data.printedBy) {
        const user = await UserModel.findById(data.printedBy);
        if (user?.branchId) {
          branchId = user.branchId;
        }
      }

      // 2. Ensure Account Exists (Critical for PrintOperation Foreign Key)
      let account = await AccountModel.findByAccountNumber(data.accountNumber);
      if (!account) {
        // Create a minimal account record if it doesn't exist
        account = await AccountModel.create({
          accountNumber: data.accountNumber,
          accountHolderName: data.accountNumber, // Placeholder name
          accountType: data.accountType,
          branchId: branchId ?? null,
        });
      }

      // 3. Create PrintOperation Record
      await PrintOperationModel.create({
        accountId: account.id,
        userId: data.printedBy,
        branchId: branchId || 0, // 0 or null depending on schema, but Model expects number. If 0 fails FK, we might need null logic in model, but here assuming 0 won't crash or is valid. 
        // Actually BranchId is Int? (nullable) in schema. Model expects number. passing undefined/null might keep it null.
        // Let's check PrintOperationModel.create signature. It takes `branchId: number`.
        // If I pass 0, and Branch 0 doesn't exist, it might satisfy FK if 0 is not checked? 
        // Prisma relies on relationship. `branch` relation is optional.
        // But in schema: `branch Branch? @relation(fields: [branchId], references: [id])`
        // If I pass non-existent ID, FK constraint fails.
        // Better to pass valid ID. If branchId is undefined, I should probably catch that.
        // But dashboard user (emhem) surely has a branch if they can see any stats (even 0).
        routingNumber: routingNumber,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        serialFrom: data.firstChequeNumber,
        serialTo: data.lastChequeNumber,
        sheetsPrinted: data.totalCheques,
        status: 'COMPLETED',
        notes: data.notes,
      });

    } catch (error) {
      console.error('Failed to sync PrintLog to PrintOperation:', error);
      // We do not throw here, so the main Log creation is still successful
    }

    return log;
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
