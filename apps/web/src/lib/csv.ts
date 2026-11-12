// Injection de formule (CSV/Excel) : une cellule commençant par = + - @ ou une
// tabulation/retour serait interprétée comme formule. On la préfixe d'une apostrophe.
// Les nombres (ex. « -1500 ») restent intacts.
function neutraliser(v: string): string {
  if (/^[=+\-@\t\r]/.test(v) && !/^-?\d+([.,]\d+)?$/.test(v)) return `'${v}`;
  return v;
}

// Export CSV (séparateur « ; », BOM UTF-8 pour Excel).
export function exportCsv(
  filename: string,
  header: string[],
  rows: (string | number | null | undefined)[][],
) {
  const csv = [header, ...rows]
    .map((r) => r.map((f) => `"${neutraliser(String(f ?? '')).replace(/"/g, '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
