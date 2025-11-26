import prisma from '../lib/prisma';
import { PrintSettings } from '@prisma/client';
import {
  DEFAULT_BANK_STAFF_SETTINGS,
  DEFAULT_CORPORATE_SETTINGS,
  DEFAULT_INDIVIDUAL_SETTINGS,
} from '../types/printSettings.types';

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
    accountNumberX: number;
    accountNumberY: number;
    accountNumberFontSize: number;
    accountNumberAlign: string;
    checkSequenceX: number;
    checkSequenceY: number;
    checkSequenceFontSize: number;
    checkSequenceAlign: string;
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
        accountNumberX: data.accountNumberX,
        accountNumberY: data.accountNumberY,
        accountNumberFontSize: data.accountNumberFontSize,
        accountNumberAlign: data.accountNumberAlign,
        checkSequenceX: data.checkSequenceX,
        checkSequenceY: data.checkSequenceY,
        checkSequenceFontSize: data.checkSequenceFontSize,
        checkSequenceAlign: data.checkSequenceAlign,
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
        accountNumber: {
          x: settings.accountNumberX ?? 117.5,
          y: settings.accountNumberY ?? 10,
          fontSize: settings.accountNumberFontSize ?? 14,
          align: settings.accountNumberAlign ?? 'center',
        },
        checkSequence: {
          x: settings.checkSequenceX ?? 20,
          y: settings.checkSequenceY ?? 18,
          fontSize: settings.checkSequenceFontSize ?? 12,
          align: settings.checkSequenceAlign ?? 'left',
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
      return { ...DEFAULT_INDIVIDUAL_SETTINGS };
    }

    if (accountType === 2) {
      return { ...DEFAULT_CORPORATE_SETTINGS };
    }

    return { ...DEFAULT_BANK_STAFF_SETTINGS };
  }
}

