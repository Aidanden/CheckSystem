import { BankAPIResponse, CheckbookDetails, ChequeStatusInfo } from '../types';
import { parseStringPromise } from 'xml2js';

interface QueryCheckbookParams {
  accountNumber: string;
  branchCode: string;
  firstChequeNumber?: number;
}

export class BankAPIClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.BANK_API_URL || 'http://fcubsuatapp1.aiib.ly:9005/FCUBSAccService/FCUBSAccService';
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

  private buildSoapEnvelope(params: QueryCheckbookParams): string {
    const firstChequeXml = params.firstChequeNumber
      ? `<fcub:FIRST_CHEQUE_NUMBER>${params.firstChequeNumber}</fcub:FIRST_CHEQUE_NUMBER>`
      : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fcub="http://fcubs.ofss.com/service/FCUBSAccService">
  <soapenv:Header/>
  <soapenv:Body>
    <fcub:QUERYCHECKBOOK_IOFS_REQ>
      <fcub:FCUBS_HEADER>
        <fcub:SOURCE>FCAT</fcub:SOURCE>
        <fcub:UBSCOMP>FCUBS</fcub:UBSCOMP>
        <fcub:USERID>${process.env.BANK_API_USER || 'ADMINUSER1'}</fcub:USERID>
        <fcub:BRANCH>${params.branchCode}</fcub:BRANCH>
        <fcub:SERVICE>FCUBSAccService</fcub:SERVICE>
        <fcub:OPERATION>QueryCheckBook</fcub:OPERATION>
      </fcub:FCUBS_HEADER>
      <fcub:FCUBS_BODY>
        <fcub:Chq-Bk-Details-IO>
          <fcub:ACCOUNT_BRANCH>${params.branchCode}</fcub:ACCOUNT_BRANCH>
          <fcub:ACCOUNT>${params.accountNumber}</fcub:ACCOUNT>
          ${firstChequeXml}
        </fcub:Chq-Bk-Details-IO>
      </fcub:FCUBS_BODY>
    </fcub:QUERYCHECKBOOK_IOFS_REQ>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private async postSoapRequest(envelope: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml;charset=UTF-8',
        },
        body: envelope,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Bank SOAP error: ${response.status} - ${text}`);
      }

      return response.text();
    } catch (error: any) {
      if (error.cause?.code === 'ECONNREFUSED') {
        console.error(`❌ Cannot connect to FCUBS SOAP endpoint: ${this.baseUrl}`);
        console.error('   Make sure the SOAP server is running and accessible.');
        console.error('   Check BANK_API_URL in your .env file.');
        throw new Error(`FCUBS SOAP server is not accessible at ${this.baseUrl}. Please check your network connection and server configuration.`);
      }
      throw error;
    }
  }

  private extractText(value: any): string | undefined {
    if (Array.isArray(value) && value.length > 0) {
      return typeof value[0] === 'string' ? value[0] : undefined;
    }
    if (typeof value === 'string') {
      return value;
    }
    return undefined;
  }

  private parseChequeStatuses(rawStatuses: any[]): ChequeStatusInfo[] {
    return rawStatuses.map((status) => ({
      chequeBookNumber: this.extractText(status.CHQ_BOOK_NO) || '',
      chequeNumber: parseInt(this.extractText(status.CHQ_NO) || '0', 10),
      status: this.extractText(status.STATUS) || '',
    }));
  }

  async queryCheckbook(params: QueryCheckbookParams): Promise<CheckbookDetails> {
    const envelope = this.buildSoapEnvelope(params);
    console.log('📤 Sending SOAP Request:', envelope);

    const xmlResponse = await this.postSoapRequest(envelope);
    console.log('📥 Received SOAP Response:', xmlResponse);

    // Use stripPrefix to handle namespaces consistently
    const parsed = await parseStringPromise(xmlResponse, {
      explicitArray: true,
      ignoreAttrs: false,
      tagNameProcessors: [require('xml2js').processors.stripPrefix]
    });

    console.log('📊 Parsed XML:', JSON.stringify(parsed, null, 2));

    // Navigate through the structure (without prefixes)
    const envelopeNode = parsed['Envelope'];
    const body = envelopeNode?.['Body']?.[0];

    if (!body) throw new Error('Invalid SOAP response: missing body');

    // Handle Faults
    if (body['Fault']) {
      const fault = body['Fault'][0];
      const faultString = this.extractText(fault['faultstring']) || 'Unknown SOAP Fault';
      const detail = fault['detail']?.[0]?.['message']?.[0] || '';
      throw new Error(`SOAP Fault: ${faultString} - ${detail}`);
    }

    const response = body['QUERYCHECKBOOK_IOFS_RES'];
    if (!response) {
      // Try to find it recursively or check for alternative names if needed
      throw new Error('Invalid SOAP response: missing QUERYCHECKBOOK_IOFS_RES');
    }

    const fcubsBody = response[0]?.FCUBS_BODY?.[0];
    const details = fcubsBody?.['Chq-Bk-Details-Full'];
    if (!details) {
      throw new Error('No checkbook details returned from banking system');
    }

    const detailNode = details[0];
    const chequeStatusesRaw = detailNode?.['Cavws-Cheque-Status'] || [];

    return {
      accountNumber: this.extractText(detailNode.ACCOUNT) || params.accountNumber,
      accountBranch: this.extractText(detailNode.ACCOUNT_BRANCH) || params.branchCode,
      firstChequeNumber: detailNode.FIRST_CHEQUE_NUMBER ? parseInt(this.extractText(detailNode.FIRST_CHEQUE_NUMBER) || '0', 10) : undefined,
      chequeLeaves: detailNode.CHEQUE_LEAVES ? parseInt(this.extractText(detailNode.CHEQUE_LEAVES) || '0', 10) : undefined,
      requestStatus: this.extractText(detailNode.REQUEST_STATUS),
      deliveryMode: this.extractText(detailNode.DELIVERY_MODE),
      checkBookType: this.extractText(detailNode.CH_BK_TYPE),
      languageCode: this.extractText(detailNode.LANGCODE),
      chequeStatuses: this.parseChequeStatuses(chequeStatusesRaw),
    };
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

