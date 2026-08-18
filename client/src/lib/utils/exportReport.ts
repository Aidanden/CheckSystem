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

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, ' ').trim() || 'التقرير';
  return cleaned.slice(0, 31);
}

function cellXml(value: CellValue): string {
  if (value === null || value === undefined || value === '') {
    return '<Cell><Data ss:Type="String"></Data></Cell>';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
}

function rowXml(cells: CellValue[], styleId?: string): string {
  const style = styleId ? ` ss:StyleID="${styleId}"` : '';
  return `<Row${style}>${cells.map(cellXml).join('')}</Row>`;
}

function buildSpreadsheetXml(options: {
  sheetName?: string;
  headers: string[];
  rows: CellValue[][];
  summaryRows?: CellValue[][];
}): string {
  const sheetName = sanitizeSheetName(options.sheetName || 'التقرير');
  const tableRows: string[] = [];

  if (options.summaryRows?.length) {
    for (const summary of options.summaryRows) {
      tableRows.push(rowXml(summary));
    }
    tableRows.push(rowXml([]));
  }

  tableRows.push(rowXml(options.headers, 'Header'));
  for (const row of options.rows) {
    tableRows.push(rowXml(row.map((cell) => cell ?? '')));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center" ss:ReadingOrder="RightToLeft"/>
   <Font ss:FontName="Tahoma" ss:Size="11"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/>
   <Font ss:FontName="Tahoma" ss:Size="11" ss:Bold="1"/>
   <Interior ss:Color="#D9E2F3" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>${tableRows.join('')}</Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <DisplayRightToLeft/>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

export function downloadExcel(options: {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: CellValue[][];
  summaryRows?: CellValue[][];
}) {
  const xml = buildSpreadsheetXml(options);
  const blob = new Blob(['\uFEFF', xml], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.filename.endsWith('.xls')
    ? options.filename
    : options.filename.replace(/\.xlsx$/i, '.xls');
  if (!a.download.endsWith('.xls')) {
    a.download = `${a.download}.xls`;
  }
  a.click();
  URL.revokeObjectURL(url);
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
  return `${prefix}-${date}.xls`;
}
