import { request } from '../client';

export interface SoapChequeStatus {
  chequeBookNumber: string;
  chequeNumber: number;
  status: string;
}

export interface SoapCheckbookResponse {
  accountNumber: string;
  accountBranch: string;
  branchName?: string;
  routingNumber?: string;
  firstChequeNumber?: number;
  chequeLeaves?: number;
  requestStatus?: string;
  checkBookType?: string;
  deliveryMode?: string;
  languageCode?: string;
  maker?: string;
  makerStamp?: string;
  checker?: string;
  checkerStamp?: string;
  chequeStatuses: SoapChequeStatus[];
  rawXml?: string;
}

interface QueryCheckbookParams {
  accountNumber: string;
  branchCode?: string;
  firstChequeNumber?: number;
}

export interface SoapInstrumentResponse {
  txnRefNo: string;
  customerNo: string;
  accountNumber: string;
  accountHolderName: string;
  beneficiaryName: string;
  amount: number;
  currency: string;
  instrumentNo: string;
  instrumentType: string;
  instrumentCode: string;
  instrumentDesc: string;
  instrumentStatus: string;
  issueDate: string;
  bookDate: string;
  txnBranch: string;
  txnStatus: string;
  branchName?: string;
  routingNumber?: string;
  accountingNumber?: string;
  branchNumber?: string;
  branchId?: number;
  alreadyPrinted?: boolean;
}

export const soapService = {
  queryCheckbook: async (params: QueryCheckbookParams): Promise<SoapCheckbookResponse> => {
    return request<SoapCheckbookResponse>({
      url: '/soap/query-checkbook',
      method: 'POST',
      data: params,
    });
  },

  queryInstrument: async (params: { txnRefNo: string; branchCode?: string }): Promise<SoapInstrumentResponse> => {
    return request<SoapInstrumentResponse>({
      url: '/soap/query-instrument',
      method: 'POST',
      data: params,
    });
  },
};
