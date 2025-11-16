// Print Settings Types for physical check printing

export interface PrintPosition {
  x: number; // mm from left
  y: number; // mm from top
  fontSize?: number; // pt
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export interface CheckPrintSettings {
  id?: number;
  accountType: 1 | 2; // 1: Individual, 2: Corporate
  
  // Check dimensions (mm)
  checkWidth: number;
  checkHeight: number;
  
  // Print positions for each element
  branchName: PrintPosition;
  serialNumber: PrintPosition;
  accountHolderName: PrintPosition;
  micrLine: PrintPosition;
  
  // Optional: Date field
  dateField?: PrintPosition;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export const DEFAULT_INDIVIDUAL_SETTINGS: Omit<CheckPrintSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  accountType: 1,
  checkWidth: 235, // mm
  checkHeight: 86, // mm
  
  branchName: {
    x: 117.5, // center (235/2)
    y: 10,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'center',
  },
  
  serialNumber: {
    x: 200, // right side
    y: 18,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'right',
  },
  
  accountHolderName: {
    x: 20, // left side
    y: 70,
    fontSize: 10,
    fontWeight: 'normal',
    align: 'left',
  },
  
  micrLine: {
    x: 117.5, // center
    y: 80,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'center',
  },
};

export const DEFAULT_CORPORATE_SETTINGS: Omit<CheckPrintSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  accountType: 2,
  checkWidth: 240, // mm
  checkHeight: 86, // mm
  
  branchName: {
    x: 120, // center (240/2)
    y: 10,
    fontSize: 14,
    fontWeight: 'bold',
    align: 'center',
  },
  
  serialNumber: {
    x: 205, // right side
    y: 18,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'right',
  },
  
  accountHolderName: {
    x: 20, // left side
    y: 70,
    fontSize: 10,
    fontWeight: 'normal',
    align: 'left',
  },
  
  micrLine: {
    x: 120, // center
    y: 80,
    fontSize: 12,
    fontWeight: 'normal',
    align: 'center',
  },
};

