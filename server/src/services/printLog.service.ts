import { PrintLogModel, CreatePrintLogData } from '../models/PrintLog.model';
import { PrintOperationModel } from '../models/PrintOperation.model';
import { AccountModel } from '../models/Account.model';
import { UserModel } from '../models/User.model';
import { InventoryService } from './inventory.service';
import { AccountType, StockType } from '../types';

export class PrintLogService {
  static async createPrintLog(data: CreatePrintLogData) {
    // خصم المخزون عند الطباعة العادية
    if (data.operationType === 'print') {
      try {
        // تحديد نوع المخزون بناءً على نوع الحساب
        // Individual (1) و Employee (3) يستخدمان Individual stock
        // Corporate (2) يستخدم Corporate stock
        const accountType = Number(data.accountType);
        const stockType: StockType = accountType === AccountType.CORPORATE
          ? StockType.CORPORATE
          : StockType.INDIVIDUAL;
        const stockLabel = stockType === StockType.CORPORATE ? 'شركات' : 'أفراد';

        console.log(`📊 تحديد نوع المخزون: accountType=${accountType} (${accountType === AccountType.CORPORATE ? 'شركة' : accountType === AccountType.EMPLOYEE ? 'موظف' : 'فردي'}) => stockType=${stockType} (${stockType === StockType.CORPORATE ? 'شركة' : 'فردي'})`);

        // عدد الأوراق المطبوعة (يجب خصمها من المخزون)
        const sheetsToDeduct = data.totalCheques;

        // التحقق من توفر المخزون قبل الخصم
        const availableQuantity = await InventoryService.getAvailableQuantity(stockType);
        if (availableQuantity < sheetsToDeduct) {
          throw new Error(
            `لا يمكن الطباعة: لا يوجد مخزون كافٍ من شيكات ${stockLabel}. المطلوب: ${sheetsToDeduct} ورقة، المتاح: ${availableQuantity} ورقة. يرجى إضافة مخزون ${stockLabel} أولاً.`
          );
        }

        // خصم عدد الأوراق الفعلي من المخزون
        await InventoryService.deductInventory(
          stockType,
          sheetsToDeduct,
          data.printedBy,
          `طباعة دفتر شيكات للحساب ${data.accountNumber} (${sheetsToDeduct} ورقة - من ${data.firstChequeNumber} إلى ${data.lastChequeNumber})`
        );

        console.log(`✅ تم خصم ${sheetsToDeduct} ورقة من المخزون (نوع: ${stockType === StockType.INDIVIDUAL ? 'فردي' : 'شركة'})`);
      } catch (error) {
        console.error('❌ خطأ في خصم المخزون:', error);
        if (error instanceof Error) {
          // رسالة نقص المخزون تُعرض كما هي (أفراد / شركات)
          if (error.message.includes('مخزون') || error.message.includes('لا يمكن الطباعة')) {
            throw error;
          }
          throw new Error(`فشل خصم المخزون: ${error.message}`);
        }
        throw new Error('فشل خصم المخزون');
      }
    }
    // خصم المخزون عند إعادة الطباعة (فقط إذا كانت الورقة تالفة)
    else if (data.operationType === 'reprint') {
      // التحقق من وجود سبب إعادة الطباعة
      if (!data.reprintReason) {
        throw new Error('يجب تحديد سبب إعادة الطباعة (ورقة تالفة أو ورقة لم تطبع)');
      }

      // إذا كانت الورقة تالفة، يجب خصم عدد الأوراق من المخزون
      if (data.reprintReason === 'damaged') {
        try {
          // تحديد نوع المخزون بناءً على نوع الحساب
          const accountType = Number(data.accountType);
          const stockType: StockType = accountType === AccountType.CORPORATE
            ? StockType.CORPORATE
            : StockType.INDIVIDUAL;
          const stockLabel = stockType === StockType.CORPORATE ? 'شركات' : 'أفراد';

          console.log(`📊 إعادة طباعة - تحديد نوع المخزون: accountType=${accountType} (${accountType === AccountType.CORPORATE ? 'شركة' : accountType === AccountType.EMPLOYEE ? 'موظف' : 'فردي'}) => stockType=${stockType} (${stockType === StockType.CORPORATE ? 'شركة' : 'فردي'})`);

          // عدد الأوراق المعاد طباعتها (يجب خصمها من المخزون)
          const sheetsToDeduct = data.totalCheques;

          // التحقق من توفر المخزون قبل الخصم
          const availableQuantity = await InventoryService.getAvailableQuantity(stockType);
          if (availableQuantity < sheetsToDeduct) {
            throw new Error(
              `لا يمكن الطباعة: لا يوجد مخزون كافٍ من شيكات ${stockLabel}. المطلوب: ${sheetsToDeduct} ورقة، المتاح: ${availableQuantity} ورقة. يرجى إضافة مخزون ${stockLabel} أولاً.`
            );
          }

          // خصم عدد الأوراق المعاد طباعتها من المخزون
          await InventoryService.deductInventory(
            stockType,
            sheetsToDeduct,
            data.printedBy,
            `إعادة طباعة دفتر شيكات تالف للحساب ${data.accountNumber} (${sheetsToDeduct} ورقة - من ${data.firstChequeNumber} إلى ${data.lastChequeNumber})`
          );

          console.log(`✅ تم خصم ${sheetsToDeduct} ورقة من المخزون (إعادة طباعة - تالفة) (نوع: ${stockType === StockType.INDIVIDUAL ? 'فردي' : 'شركة'})`);
        } catch (error) {
          console.error('❌ خطأ في خصم المخزون عند إعادة الطباعة:', error);
          if (error instanceof Error) {
            if (error.message.includes('مخزون') || error.message.includes('لا يمكن الطباعة')) {
              throw error;
            }
            throw new Error(`فشل خصم المخزون: ${error.message}`);
          }
          throw new Error('فشل خصم المخزون');
        }
      }
      // إذا كانت الورقة لم تطبع، لا يتم خصم من المخزون
      else if (data.reprintReason === 'not_printed') {
        console.log(`ℹ️ إعادة طباعة بدون خصم من المخزون (الورقة لم تطبع) - ${data.totalCheques} ورقة`);
      }
    }

    const log = await PrintLogModel.create(data);

    // Sync to PrintOperation for Dashboard Statistics
    try {
      const { BranchModel } = await import('../models/Branch.model');
      const { accountBranchFromNumber } = await import('../utils/branchAccess');
      const accountBranchCode = accountBranchFromNumber(data.accountNumber) || String(data.accountBranch || '').replace(/\D/g, '').slice(-3).padStart(3, '0');
      const accountBranch = await BranchModel.findByBranchCode(accountBranchCode);

      let branchId = accountBranch?.id;
      let routingNumber = accountBranch?.routingNumber || data.accountBranch;

      if (!branchId && data.printedBy) {
        const user = await UserModel.findById(data.printedBy);
        if (user?.branchId) {
          branchId = user.branchId;
        }
      }

      let account = await AccountModel.findByAccountNumber(data.accountNumber);
      const holderName = (data.customerName && data.customerName !== data.accountNumber)
        ? data.customerName
        : account?.accountHolderName && account.accountHolderName !== data.accountNumber
          ? account.accountHolderName
          : data.customerName || data.accountNumber;

      if (!account) {
        account = await AccountModel.create({
          accountNumber: data.accountNumber,
          accountHolderName: holderName,
          accountType: data.accountType,
          branchId: branchId ?? null,
        });
      } else if (holderName && account.accountHolderName === account.accountNumber) {
        await AccountModel.updateName(data.accountNumber, holderName);
      }

      if (branchId) {
        await PrintOperationModel.create({
          accountId: account.id,
          userId: data.printedBy,
          branchId,
          routingNumber,
          accountNumber: data.accountNumber,
          accountType: data.accountType,
          serialFrom: data.firstChequeNumber,
          serialTo: data.lastChequeNumber,
          sheetsPrinted: data.totalCheques,
          status: 'COMPLETED',
          notes: data.notes,
        });
      }
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
    userId?: number;
    accountBranch?: string;
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
      userId: options?.userId,
      accountBranch: options?.accountBranch,
    });
  }

  static async getLogById(id: number) {
    return PrintLogModel.findById(id);
  }

  static async allowReprintForCheques(accountNumber: string, chequeNumbers: number[]) {
    return PrintLogModel.allowReprint(accountNumber, chequeNumbers);
  }
}
