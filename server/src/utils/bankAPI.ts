import { BankAPIResponse } from '../types';

export class BankAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BANK_API_URL || 'http://localhost:8000/api';
    this.apiKey = process.env.BANK_API_KEY || '';
  }

  async getAccountInfo(accountNumber: string): Promise<BankAPIResponse> {
    try {
      // TODO: Replace with actual API call
      // For now, this is a mock implementation
      const response = await fetch(`${this.baseUrl}/accounts/${accountNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Bank API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as BankAPIResponse;
    } catch (error) {
      console.error('Error fetching account from bank API:', error);
      throw new Error('Failed to fetch account information from banking system');
    }
  }

  // Mock method for development/testing
  async getAccountInfoMock(accountNumber: string): Promise<BankAPIResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Test accounts database (15 digits)
    const testAccounts: { [key: string]: BankAPIResponse } = {
      // Individual accounts
      '100012345678901': {
        account_number: '100012345678901',
        account_holder_name: 'أحمد محمد علي السيد',
        account_type: 1,
      },
      '100023456789012': {
        account_number: '100023456789012',
        account_holder_name: 'فاطمة حسن محمود',
        account_type: 1,
      },
      // Corporate account
      '200034567890123': {
        account_number: '200034567890123',
        account_holder_name: 'شركة التقنية المتقدمة المحدودة',
        account_type: 2,
      },
    };

    // Check if account exists in test database
    if (testAccounts[accountNumber]) {
      return testAccounts[accountNumber];
    }

    // For other accounts, generate mock data based on pattern
    const isCompany = accountNumber.startsWith('2');
    
    return {
      account_number: accountNumber,
      account_holder_name: isCompany ? 'شركة الأمثلة المحدودة' : 'مستخدم تجريبي',
      account_type: isCompany ? 2 : 1,
    };
  }
}

export const bankAPI = new BankAPIClient();

