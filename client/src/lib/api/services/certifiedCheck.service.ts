import { request } from '../client';

export interface CertifiedBranch {
    id: number;
    branchName: string;
    branchLocation: string;
    routingNumber: string;
    branchNumber: string;
    accountingNumber: string;
    lastSerial: number;
}

export interface CertifiedSerialRange {
    branchId: number;
    branchName: string;
    accountingNumber: string;
    routingNumber: string;
    firstSerial: number;
    lastSerial: number;
    checksCount: number;
}

export interface CertifiedCheckLog {
    id: number;
    branchId: number;
    branchName: string;
    accountingNumber: string;
    routingNumber: string;
    firstSerial: number;
    lastSerial: number;
    totalChecks: number;
    operationType: 'print' | 'reprint';
    printedBy: number;
    printedByName: string;
    printDate: string;
    notes?: string;
    user?: {
        id: number;
        username: string;
    };
    branch?: {
        id: number;
        branchName: string;
    };
}

export interface CertifiedPrintResult {
    success: boolean;
    log: CertifiedCheckLog;
    printData: {
        branchId: number;
        branchName: string;
        accountingNumber: string;
        routingNumber: string;
        firstSerial: number;
        lastSerial: number;
        checksCount: number;
    };
}

export interface CertifiedStatistics {
    totalBooks: number;
    totalChecks: number;
    lastPrintDate: string | null;
    branchSerials: Array<{
        branchId: number;
        branchName: string;
        lastSerial: number;
    }>;
}

export interface CertifiedSettings {
    id?: number;
    accountType: number;
    checkWidth: number;
    checkHeight: number;
    branchName: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    serialNumber: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    accountNumber: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    checkSequence: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    accountHolderName: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
    micrLine: {
        x: number;
        y: number;
        fontSize: number;
        align: string;
    };
}

export const certifiedCheckService = {
    // Get branches available for certified check printing
    getBranches: async (): Promise<CertifiedBranch[]> => {
        return request<CertifiedBranch[]>({
            url: '/certified-checks/branches',
            method: 'GET',
        });
    },

    // Get next serial range for a branch
    getNextSerialRange: async (branchId: number): Promise<CertifiedSerialRange> => {
        return request<CertifiedSerialRange>({
            url: `/certified-checks/serial/${branchId}`,
            method: 'GET',
        });
    },

    // Print a new certified check book
    printBook: async (branchId: number, notes?: string): Promise<CertifiedPrintResult> => {
        return request<CertifiedPrintResult>({
            url: '/certified-checks/print',
            method: 'POST',
            data: { branchId, notes },
        });
    },

    // Reprint a certified check book
    reprintBook: async (logId: number): Promise<CertifiedPrintResult> => {
        return request<CertifiedPrintResult>({
            url: `/certified-checks/reprint/${logId}`,
            method: 'POST',
        });
    },

    // Get print logs
    getLogs: async (options?: {
        skip?: number;
        take?: number;
        branchId?: number;
    }): Promise<{ logs: CertifiedCheckLog[]; total: number }> => {
        return request<{ logs: CertifiedCheckLog[]; total: number }>({
            url: '/certified-checks/logs',
            method: 'GET',
            params: options,
        });
    },

    // Get statistics
    getStatistics: async (branchId?: number): Promise<CertifiedStatistics> => {
        return request<CertifiedStatistics>({
            url: '/certified-checks/statistics',
            method: 'GET',
            params: branchId ? { branchId } : undefined,
        });
    },

    // Get print settings
    getSettings: async (): Promise<CertifiedSettings> => {
        return request<CertifiedSettings>({
            url: '/certified-checks/settings',
            method: 'GET',
        });
    },

    // Update print settings
    updateSettings: async (settings: CertifiedSettings): Promise<{ success: boolean }> => {
        return request<{ success: boolean }>({
            url: '/certified-checks/settings',
            method: 'PUT',
            data: settings,
        });
    },
};
