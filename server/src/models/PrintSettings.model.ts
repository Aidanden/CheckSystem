import prisma from '../lib/prisma';
import { PrintSettings } from '@prisma/client';

export class PrintSettingsModel {
  static async findByAccountType(accountType: number): Promise<PrintSettings | null> {
    return prisma.printSettings.findUnique({
      where: { accountType },
    });
  }

  static async upsert(data: {
    accountType: number;
    checkWidth: number;
    checkHeight: number;
    branchNameX: number;
    branchNameY: number;
    branchNameFontSize: number;
    branchNameAlign: string;
    serialNumberX: number;
    serialNumberY: number;
    serialNumberFontSize: number;
    serialNumberAlign: string;
    accountHolderNameX: number;
    accountHolderNameY: number;
    accountHolderNameFontSize: number;
    accountHolderNameAlign: string;
    micrLineX: number;
    micrLineY: number;
    micrLineFontSize: number;
    micrLineAlign: string;
  }): Promise<PrintSettings> {
    return prisma.printSettings.upsert({
      where: { accountType: data.accountType },
      update: {
        checkWidth: data.checkWidth,
        checkHeight: data.checkHeight,
        branchNameX: data.branchNameX,
        branchNameY: data.branchNameY,
        branchNameFontSize: data.branchNameFontSize,
        branchNameAlign: data.branchNameAlign,
        serialNumberX: data.serialNumberX,
        serialNumberY: data.serialNumberY,
        serialNumberFontSize: data.serialNumberFontSize,
        serialNumberAlign: data.serialNumberAlign,
        accountHolderNameX: data.accountHolderNameX,
        accountHolderNameY: data.accountHolderNameY,
        accountHolderNameFontSize: data.accountHolderNameFontSize,
        accountHolderNameAlign: data.accountHolderNameAlign,
        micrLineX: data.micrLineX,
        micrLineY: data.micrLineY,
        micrLineFontSize: data.micrLineFontSize,
        micrLineAlign: data.micrLineAlign,
      },
      create: data,
    });
  }

  static async getOrDefault(accountType: number): Promise<any> {
    const settings = await this.findByAccountType(accountType);
    
    if (settings) {
      return {
        id: settings.id,
        accountType: settings.accountType,
        checkWidth: settings.checkWidth,
        checkHeight: settings.checkHeight,
        branchName: {
          x: settings.branchNameX,
          y: settings.branchNameY,
          fontSize: settings.branchNameFontSize,
          align: settings.branchNameAlign,
        },
        serialNumber: {
          x: settings.serialNumberX,
          y: settings.serialNumberY,
          fontSize: settings.serialNumberFontSize,
          align: settings.serialNumberAlign,
        },
        accountHolderName: {
          x: settings.accountHolderNameX,
          y: settings.accountHolderNameY,
          fontSize: settings.accountHolderNameFontSize,
          align: settings.accountHolderNameAlign,
        },
        micrLine: {
          x: settings.micrLineX,
          y: settings.micrLineY,
          fontSize: settings.micrLineFontSize,
          align: settings.micrLineAlign,
        },
      };
    }

    // Return defaults if not found
    if (accountType === 1) {
      return {
        accountType: 1,
        checkWidth: 235,
        checkHeight: 86,
        branchName: { x: 117.5, y: 10, fontSize: 14, align: 'center' },
        serialNumber: { x: 200, y: 18, fontSize: 12, align: 'right' },
        accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' },
        micrLine: { x: 117.5, y: 80, fontSize: 12, align: 'center' },
      };
    } else {
      return {
        accountType: 2,
        checkWidth: 240,
        checkHeight: 86,
        branchName: { x: 120, y: 10, fontSize: 14, align: 'center' },
        serialNumber: { x: 205, y: 18, fontSize: 12, align: 'right' },
        accountHolderName: { x: 20, y: 70, fontSize: 10, align: 'left' },
        micrLine: { x: 120, y: 80, fontSize: 12, align: 'center' },
      };
    }
  }
}

