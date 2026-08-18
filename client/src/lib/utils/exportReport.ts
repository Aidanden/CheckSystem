import * as XLSX from 'xlsx';

export const EXPORT_MAX_ROWS = 10000;

export function accountTypeLabel(type: number | null | undefined): string {
  if (type === 2) return 'شركة';
  if (type === 3) return 'موظف';
  if (type === 1) return 'فردي';
  return '—';
}

export function printStatusLabel(status: string | null | undefined): string {
  if (status === 'COMPLETED') return 'مكتمل';
  if (status === 'PENDING') return 'قيد الانتظار';
  if (status === 'FAILED') return 'فشل';
  return status || '—';
}

export function reprintReasonLabel(reason?: string | null): string {
  if (reason === 'damaged') return 'ورقة تالفة';
  if (reason === 'not_printed') return 'ورقة لم تطبع';
  return '—';
}

export function operationTypeLabel(type: string): string {
  if (type === 'reprint') return 'إعادة طباعة';
  if (type === 'print') return 'طباعة';
  if (type === 'query') return 'استعلام';
  return type;
}

export function stockTypeLabel(type: number | null | undefined): string {
  if (type === 2) return 'شركة';
  if (type === 3) return 'موظف';
  if (type === 1) return 'فردي';
  return '—';
}

export function inventoryTransactionLabel(type: string): string {
  if (type === 'ADD') return 'إضافة';
  if (type === 'DEDUCT') return 'خصم';
  return type;
}

type CellValue = string | number | null | undefined;

export function downloadExcel(options: {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: CellValue[][];
  summaryRows?: CellValue[][];
}) {
  const sheetData: CellValue[][] = [];
  if (options.summaryRows?.length) {
    sheetData.push(...options.summaryRows, []);
  }
  sheetData.push(options.headers, ...options.rows.map((row) => row.map((cell) => cell ?? '')));

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = options.headers.map((header) => ({
    wch: Math.min(40, Math.max(String(header).length + 4, 14)),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'التقرير');

  const filename = options.filename.endsWith('.xlsx') ? options.filename : `${options.filename}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

export async function fetchAllPaginated<T>(options: {
  fetchPage: (skip: number, take: number) => Promise<{ items: T[]; total: number }>;
  pageSize?: number;
  maxRows?: number;
}): Promise<T[]> {
  const pageSize = options.pageSize ?? 500;
  const maxRows = options.maxRows ?? EXPORT_MAX_ROWS;
  const all: T[] = [];
  let skip = 0;
  let total = Infinity;

  while (all.length < maxRows && all.length < total) {
    const take = Math.min(pageSize, maxRows - all.length);
    const { items, total: reportedTotal } = await options.fetchPage(skip, take);
    total = reportedTotal;
    if (!items.length) break;
    all.push(...items);
    skip += items.length;
    if (items.length < take) break;
  }

  return all;
}

export function reportFilename(prefix: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.xlsx`;
}
