import prisma from '../lib/prisma';
import { Account } from '@prisma/client';

export class AccountModel {
  static async findAll(): Promise<Account[]> {
    return prisma.account.findMany({
      orderBy: { id: 'desc' },
    });
  }

  static async findById(id: number): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { id },
    });
  }

  static async findByAccountNumber(accountNumber: string): Promise<Account | null> {
    return prisma.account.findUnique({
      where: { accountNumber },
    });
  }

  static async create(account: {
    accountNumber: string;
    accountHolderName: string;
    accountType: number;
  }): Promise<Account> {
    return prisma.account.create({
      data: {
        accountNumber: account.accountNumber,
        accountHolderName: account.accountHolderName,
        accountType: account.accountType,
        lastPrintedSerial: 0,
      },
    });
  }

  static async updateName(accountNumber: string, newName: string): Promise<Account | null> {
    return prisma.account.update({
      where: { accountNumber },
      data: { accountHolderName: newName },
    });
  }

  static async updateLastPrintedSerial(
    accountNumber: string,
    lastSerial: number
  ): Promise<Account | null> {
    return prisma.account.update({
      where: { accountNumber },
      data: { lastPrintedSerial: lastSerial },
    });
  }

  static async getLastPrintedSerial(accountNumber: string): Promise<number> {
    const account = await prisma.account.findUnique({
      where: { accountNumber },
      select: { lastPrintedSerial: true },
    });
    
    return account?.lastPrintedSerial || 0;
  }
}
