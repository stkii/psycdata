import type { ParsedTable, CellValue } from '../components/DataTable';

// Normalize a cell to the display string used by the UI table
export function normalizeCell(value: CellValue): string {
  if (value === null) return 'NULL';
  if (value === undefined) return 'NA';
  return String(value);
}

// CSV escaping according to RFC4180
function csvEscape(field: string): string {
  const mustQuote = /[",\n,]/.test(field);
  let out = field.replace(/"/g, '""');
  if (mustQuote) out = '"' + out + '"';
  return out;
}

export type CsvOptions = {
  bom?: boolean; // add UTF-8 BOM (for Excel)
  newline?: '\\n' | '\\r\\n';
};

export function toCsv(table: ParsedTable, opts?: CsvOptions): string {
  const bom = opts?.bom !== false; // default true
  const nl = opts?.newline ?? '\\r\\n';
  const headers = table.headers ?? [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const colCount = Math.max(headers.length, ...rows.map((r) => (Array.isArray(r) ? r.length : 0)));

  const lines: string[] = [];
  // header line
  lines.push(Array.from({ length: colCount }, (_, i) => csvEscape(headers[i] ?? `列${i + 1}`)).join(','));
  // data lines
  for (const row of rows) {
    const cells = Array.from({ length: colCount }, (_, i) => normalizeCell((row as CellValue[])[i]));
    lines.push(cells.map(csvEscape).join(','));
  }

  const body = lines.join(nl);
  return (bom ? '\uFEFF' : '') + body + nl;
}

export type JsonExportPayload = {
  analysis: string;
  sheet: string;
  variables: string[];
  table: ParsedTable;
  meta?: Record<string, unknown>;
};

export function toJson(p: JsonExportPayload): string {
  const { analysis, sheet, variables, table } = p;
  const headers = table.headers ?? [];
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const colCount = Math.max(headers.length, ...rows.map((r) => (Array.isArray(r) ? r.length : 0)));
  const normalizedRows = rows.map((row) =>
    Array.from({ length: colCount }, (_, i) => normalizeCell((row as CellValue[])[i]))
  );
  const meta = {
    generatedAt: new Date().toISOString(),
    rounding: {
      pValue: '3 decimals, half-up; show <.001 only when rounds to 0.000',
      correlation: 'displayed to 3 decimals',
    },
    ...p.meta,
  };
  const out = {
    analysis,
    sheet,
    variables,
    meta,
    table: {
      headers,
      rows: normalizedRows,
    },
  };
  return JSON.stringify(out);
}

