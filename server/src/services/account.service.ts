import { AccountModel } from '../models/Account.model';
import { bankAPI } from '../utils/bankAPI';
import { Account } from '@prisma/client';

export class AccountService {
  static async getAllAccounts(): Promise<Account[]> {
    return AccountModel.findAll();
  }

  static async getAccountById(id: number): Promise<Account> {
    const account = await AccountModel.findById(id);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  static async getAccountByNumber(accountNumber: string): Promise<Account> {
    const account = await AccountModel.findByAccountNumber(accountNumber);
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  static async queryAccount(accountNumber: string): Promise<Account> {
    try {
      // Fetch from Bank API (use mock for development)
      const bankData = await bankAPI.getAccountInfoMock(accountNumber);

      // Check if account exists locally
      let account = await AccountModel.findByAccountNumber(accountNumber);

      if (!account) {
        // Create new account
        account = await AccountModel.create({
          accountNumber: bankData.account_number,
          accountHolderName: bankData.account_holder_name,
          accountType: bankData.account_type,
        });
      } else {
        // Update name if different
        if (account.accountHolderName !== bankData.account_holder_name) {
          account = await AccountModel.updateName(
            accountNumber,
            bankData.account_holder_name
          ) as Account;
        }
      }

      return account;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to query account: ${error.message}`);
      }
      throw error;
    }
  }

  static async getLastPrintedSerial(accountNumber: string): Promise<number> {
    return AccountModel.getLastPrintedSerial(accountNumber);
  }

  static async updateLastPrintedSerial(
    accountNumber: string,
    lastSerial: number
  ): Promise<void> {
    await AccountModel.updateLastPrintedSerial(accountNumber, lastSerial);
  }
}
