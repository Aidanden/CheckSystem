import { SystemSettingModel } from '../models/SystemSetting.model';

const SOAP_ENDPOINT_KEY = 'soap_api_url';
const SOAP_IA_ENDPOINT_KEY = 'soap_ia_api_url';
const SOAP_INSTRUMENT_ENDPOINT_KEY = 'soap_instrument_api_url';
const HIDDEN_SCREENS_KEY = 'hidden_screens';
const SCREEN_VISIBILITY_PASSWORD = process.env.SCREEN_VISIBILITY_PASSWORD || '!@#$%^';

const ALLOWED_SCREEN_HREFS = [
  '/dashboard',
  '/print',
  '/print-logs',
  '/inventory',
  '/certified-print',
  '/certified-instrument',
  '/certified-instrument-logs',
  '/certified-reports',
  '/certified-checks',
  '/certified-logs',
  '/certified-inventory',
  '/users',
  '/branches',
  '/reports',
  '/settings',
  '/certified-settings',
  '/category-settings',
];

export class SystemSettingService {
  static async getValue(key: string): Promise<string | null> {
    return SystemSettingModel.getValue(key);
  }

  static async setValue(key: string, value: string) {
    return SystemSettingModel.setValue(key, value);
  }

  static async delete(key: string): Promise<void> {
    await SystemSettingModel.deleteByKey(key);
  }

  static async getSoapEndpoint(): Promise<string> {
    const stored = await this.getValue(SOAP_ENDPOINT_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
    return process.env.BANK_API_URL || 'http://10.250.100.40:8080/FCUBSAccService';
  }

  static async updateSoapEndpoint(url: string) {
    return this.setValue(SOAP_ENDPOINT_KEY, url.trim());
  }

  static async getSoapIAEndpoint(): Promise<string> {
    const stored = await this.getValue(SOAP_IA_ENDPOINT_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
    return process.env.BANK_IA_API_URL || 'http://10.250.100.40:8080/FCUBSIAService';
  }

  static async updateSoapIAEndpoint(url: string) {
    return this.setValue(SOAP_IA_ENDPOINT_KEY, url.trim());
  }

  static async getSoapInstrumentEndpoint(): Promise<string> {
    const stored = await this.getValue(SOAP_INSTRUMENT_ENDPOINT_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
    return process.env.BANK_INSTRUMENT_API_URL || 'http://10.250.100.40:8080/InstrumentListService';
  }

  static async updateSoapInstrumentEndpoint(url: string) {
    return this.setValue(SOAP_INSTRUMENT_ENDPOINT_KEY, url.trim());
  }

  static async getHiddenScreens(): Promise<string[]> {
    const stored = await this.getValue(HIDDEN_SCREENS_KEY);
    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((href) => typeof href === 'string' && ALLOWED_SCREEN_HREFS.includes(href));
    } catch {
      return [];
    }
  }

  static verifyScreenVisibilityPassword(password: string): boolean {
    return password === SCREEN_VISIBILITY_PASSWORD;
  }

  static async updateHiddenScreens(hiddenScreens: string[]) {
    const sanitized = Array.from(
      new Set(
        hiddenScreens.filter((href) => typeof href === 'string' && ALLOWED_SCREEN_HREFS.includes(href))
      )
    );
    return this.setValue(HIDDEN_SCREENS_KEY, JSON.stringify(sanitized));
  }
}
