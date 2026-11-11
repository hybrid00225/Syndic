// Export CSV (séparateur « ; », BOM UTF-8 pour Excel).
export function exportCsv(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][],
) {
  const csv = [header, ...rows]
    .map((r) => r.map((f) => `"${String(f ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
