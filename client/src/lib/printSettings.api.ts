import { request } from '@/lib/api/client';

export interface PrintPosition {
  x: number;
  y: number;
  fontSize: number;
  align: 'left' | 'center' | 'right';
}

export interface PrintSettings {
  id?: number;
  accountType: 1 | 2 | 3 | 4;
  checkWidth: number;
  checkHeight: number;
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountNumber: PrintPosition | null;
  checkSequence: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;
}

class PrintSettingsAPI {
  async getSettings(accountType: 1 | 2 | 3 | 4): Promise<PrintSettings> {
    return request<PrintSettings>({
      url: `/print-settings/${accountType}`,
      method: 'GET',
    });
  }

  async saveSettings(settings: PrintSettings): Promise<{ success: boolean; message?: string; settings?: PrintSettings; error?: string }> {
    return request({
      url: '/print-settings',
      method: 'POST',
      data: settings,
    });
  }
}

export const printSettingsAPI = new PrintSettingsAPI();
