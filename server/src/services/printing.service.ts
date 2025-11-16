import prisma from '../lib/prisma';
import { AccountModel } from '../models/Account.model';
import { InventoryModel } from '../models/Inventory.model';
import { PrintOperationModel } from '../models/PrintOperation.model';
import { BranchModel } from '../models/Branch.model';
import { AccountService } from './account.service';
import { InventoryService } from './inventory.service';
import { AccountType, StockType, PrintStatus, PrintCheckbookResponse } from '../types';
import { CheckFormatter, CheckData, CheckbookData } from '../types/check.types';
import { PDFGenerator } from '../utils/pdfGenerator';
import * as path from 'path';

export class PrintingService {
  static async printCheckbook(
    accountNumber: string,
    userId: number,
    branchId: number,
    customSerialFrom?: number,
    customSerialTo?: number
  ): Promise<PrintCheckbookResponse> {
    try {
      // Get account information BEFORE starting transaction
      // (queryAccount may create/update account records)
      const account = await AccountService.queryAccount(accountNumber);
      if (!account) {
        throw new Error('Account not found');
      }

      const result = await prisma.$transaction(async (tx) => {

        // Get branch information using transaction client
        const branch = await tx.branch.findUnique({
          where: { id: branchId },
        });
        if (!branch) {
          throw new Error('Branch not found');
        }

        // Determine stock type and number of sheets
        const stockType: StockType = account.accountType === AccountType.INDIVIDUAL 
          ? StockType.INDIVIDUAL 
          : StockType.CORPORATE;

        const sheetsPerBook = account.accountType === AccountType.INDIVIDUAL ? 25 : 50;

        // Check inventory availability using transaction client
        const inventory = await tx.inventory.findFirst({
          where: { stockType },
          select: { quantity: true },
        });
        const currentQuantity = inventory?.quantity || 0;
        if (currentQuantity < 1) {
          throw new Error('لا يوجد مخزون كافٍ');
        }

        // Calculate serial numbers
        let serialFrom: number;
        let serialTo: number;
        
        if (customSerialFrom !== undefined && customSerialTo !== undefined) {
          // Custom range specified (for reprint)
          serialFrom = customSerialFrom;
          serialTo = customSerialTo;
          
          // Validate range
          if (serialFrom < 1 || serialTo < serialFrom) {
            throw new Error('رقم التسلسل غير صحيح');
          }
          
          const requestedSheets = serialTo - serialFrom + 1;
          if (requestedSheets > sheetsPerBook) {
            throw new Error(`لا يمكن طباعة أكثر من ${sheetsPerBook} ورقة في المرة الواحدة`);
          }
        } else {
          // Normal print: continue from last serial
          const lastSerial = account.lastPrintedSerial;
          serialFrom = lastSerial + 1;
          serialTo = lastSerial + sheetsPerBook;
        }

        // Deduct from inventory using transaction client
        await tx.inventory.updateMany({
          where: { stockType },
          data: {
            quantity: {
              decrement: 1,
            },
          },
        });

        // Record inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            stockType,
            transactionType: 'DEDUCT',
            quantity: 1,
            userId,
            notes: `طباعة دفتر شيكات للحساب ${accountNumber}`,
          },
        });

        // Update last printed serial using transaction client
        await tx.account.update({
          where: { accountNumber },
          data: { lastPrintedSerial: serialTo },
        });

        // Generate checkbook data with MICR information
        const checkbookData = this.generateCheckbookData(
          account.accountNumber,
          account.accountHolderName,
          account.accountType as 1 | 2,
          branch.branchName,
          branch.routingNumber,
          serialFrom,
          serialTo
        );

        // Create print operation record using transaction client
        const operation = await tx.printOperation.create({
          data: {
            accountId: account.id,
            userId: userId,
            branchId: branchId,
            routingNumber: branch.routingNumber,
            accountNumber: accountNumber,
            accountType: account.accountType,
            serialFrom: serialFrom,
            serialTo: serialTo,
            sheetsPrinted: sheetsPerBook,
            status: PrintStatus.COMPLETED,
          },
        });

        // Send to MICR printer (this is async but doesn't use database)
        await this.sendToMICRPrinter(checkbookData);

        // Generate PDF file
        const pdfPath = await this.generateCheckbookPDF(checkbookData);

        return {
          success: true,
          message: `تمت طباعة دفتر الشيكات بنجاح. الأرقام التسلسلية من ${serialFrom} إلى ${serialTo}`,
          operation,
          pdfPath, // Return PDF path for download
        };
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: 'حدث خطأ أثناء طباعة دفتر الشيكات',
      };
    }
  }

  static async getPrintHistory(
    userId?: number,
    branchId?: number,
    limit: number = 100
  ): Promise<any[]> {
    if (userId) {
      return PrintOperationModel.findByUserId(userId, limit);
    }
    if (branchId) {
      return PrintOperationModel.findByBranchId(branchId, limit);
    }
    return PrintOperationModel.findAll(limit);
  }

  static async getPrintStatistics(branchId?: number): Promise<any> {
    return PrintOperationModel.getStatistics(branchId);
  }

  /**
   * Generate complete checkbook data with MICR lines
   */
  private static generateCheckbookData(
    accountNumber: string,
    accountHolderName: string,
    accountType: 1 | 2,
    branchName: string,
    routingNumber: string,
    serialFrom: number,
    serialTo: number
  ): CheckbookData {
    const checks: CheckData[] = [];
    const checkSize = CheckFormatter.getCheckSize(accountType);

    // Generate data for each check in the book
    for (let serial = serialFrom; serial <= serialTo; serial++) {
      const checkNumber = serial - serialFrom + 1;
      const serialFormatted = CheckFormatter.formatSerialNumber(serial);
      const accountTypeFormatted = CheckFormatter.formatAccountType(accountType);
      const micrLine = CheckFormatter.generateMICRLine(
        serial,
        routingNumber,
        accountNumber,
        accountType
      );

      checks.push({
        checkNumber,
        serialNumber: serialFormatted,
        routingNumber,
        accountNumber,
        accountType: accountTypeFormatted,
        accountHolderName,
        branchName,
        checkSize,
        micrLine,
      });
    }

    return {
      operation: {
        operationId: 0, // Will be set after database insert
        accountNumber,
        accountHolderName,
        accountType,
        branchName,
        routingNumber,
        serialFrom,
        serialTo,
        sheetsPrinted: serialTo - serialFrom + 1,
        printDate: new Date(),
      },
      checks,
    };
  }

  /**
   * Generate PDF file for checkbook
   */
  private static async generateCheckbookPDF(checkbookData: CheckbookData): Promise<string> {
    try {
      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'output', 'checkbooks');
      const pdfPath = await PDFGenerator.generateCheckbookPDF(checkbookData, outputDir);
      
      console.log('\n📄 تم إنشاء ملف PDF:');
      console.log(`   المسار: ${pdfPath}`);
      console.log(`   الحجم: ${this.getFileSizeInMB(pdfPath)} MB`);
      
      return pdfPath;
    } catch (error) {
      console.error('❌ خطأ في إنشاء ملف PDF:', error);
      throw new Error('Failed to generate PDF file');
    }
  }

  /**
   * Get file size in MB
   */
  private static getFileSizeInMB(filepath: string): string {
    const fs = require('fs');
    const stats = fs.statSync(filepath);
    return (stats.size / (1024 * 1024)).toFixed(2);
  }

  /**
   * Send checkbook data to MICR printer
   * TODO: Implement actual printer integration
   */
  private static async sendToMICRPrinter(checkbookData: CheckbookData): Promise<void> {
    // This would send formatted MICR data to the physical printer
    console.log('='.repeat(60));
    console.log('📄 إرسال دفتر الشيكات إلى طابعة MICR');
    console.log('='.repeat(60));
    console.log('\n📋 معلومات العملية:');
    console.log(`   الحساب: ${checkbookData.operation.accountNumber}`);
    console.log(`   العميل: ${checkbookData.operation.accountHolderName}`);
    console.log(`   الفرع: ${checkbookData.operation.branchName}`);
    console.log(`   النوع: ${checkbookData.operation.accountType === 1 ? 'فردي' : 'شركة'}`);
    console.log(`   التسلسل: من ${checkbookData.operation.serialFrom} إلى ${checkbookData.operation.serialTo}`);
    console.log(`   عدد الأوراق: ${checkbookData.operation.sheetsPrinted}`);
    
    console.log('\n🖨️ نماذج من الشيكات:');
    
    // Show first 3 checks as example
    const samplesToShow = Math.min(3, checkbookData.checks.length);
    for (let i = 0; i < samplesToShow; i++) {
      const check = checkbookData.checks[i];
      console.log(`\n   ✅ شيك رقم ${check.checkNumber}:`);
      console.log(`      المقاس: ${check.checkSize.width}×${check.checkSize.height} ملم`);
      console.log(`      في الأعلى (المنتصف): ${check.branchName}`);
      console.log(`      تحته (على اليمين): ${check.serialNumber}`);
      console.log(`      في الأسفل (اليسار): ${check.accountHolderName}`);
      console.log(`      خط MICR: ${check.micrLine}`);
    }
    
    if (checkbookData.checks.length > 3) {
      console.log(`\n   ... وباقي ${checkbookData.checks.length - 3} شيك`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ تم إرسال البيانات إلى الطابعة بنجاح');
    console.log('='.repeat(60) + '\n');

    // TODO: Replace with actual printer API call
    // Example:
    // await printerAPI.printCheckbook(checkbookData);
  }
}
