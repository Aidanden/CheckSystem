import {
  CertifiedInstrumentLogModel,
  CreateInstrumentLogData,
  InstrumentLogFilters,
} from '../models/CertifiedInstrumentLog.model';

export class CertifiedInstrumentLogService {
  static isPrinted(txnRefNo: string) {
    return CertifiedInstrumentLogModel.isPrinted(txnRefNo);
  }

  static create(data: CreateInstrumentLogData) {
    return CertifiedInstrumentLogModel.create(data);
  }

  static findAll(filters: InstrumentLogFilters) {
    return CertifiedInstrumentLogModel.findAll(filters);
  }

  static getStatistics(filters: Omit<InstrumentLogFilters, 'page' | 'limit'>) {
    return CertifiedInstrumentLogModel.getStatistics(filters);
  }
}
