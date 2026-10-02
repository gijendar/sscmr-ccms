/**
 * Minimal, dependency-free CSV helpers.
 *
 * Values are escaped per RFC 4180: any value containing a comma, quote or
 * newline is wrapped in double quotes and inner quotes are doubled. A UTF-8
 * BOM is added on download so Excel opens the file with correct encoding.
 */

export type CsvValue = string | number | boolean | null | undefined;

function escapeCell(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Build a CSV document. The first row is treated as the header.
 */
export function toCsv(rows: CsvValue[][]): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/**
 * Trigger a client-side download of CSV content. No server round-trip and no
 * data leaves the browser beyond what the admin already loaded.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['\uFEFF', csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Timestamped filename, e.g. complaints-2026-09-30.csv
 */
export function csvFilename(prefix: string, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  return `${prefix}-${stamp}.csv`;
}
