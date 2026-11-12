/**
 * Service de génération des PDF sortants (listes, et demain appels de fonds,
 * relevés, reçus…). Un seul gabarit de marque : en-tête avec logo, titre,
 * filtres appliqués, pied avec date de génération et pagination « x / y ».
 *
 * jsPDF est chargé à la demande (import dynamique) : il ne pèse rien tant
 * qu'aucun document n'est généré.
 */
import type { jsPDF } from 'jspdf';

/** Document produit par l'application, prêt pour l'aperçu, l'impression ou le téléchargement. */
export interface GeneratedDocument {
  blob: Blob;
  filename: string;
}

export type PdfCell = string | number | null | undefined;

export interface PdfColumn {
  header: string;
  /** Alignement (montants et quantités à droite). */
  align?: 'left' | 'right';
}

export interface ListReport {
  title: string;
  subtitle?: string;
  /** Filtres actifs, ex. « Statut : Active ». */
  filters?: string[];
  columns: PdfColumn[];
  rows: PdfCell[][];
  /** Auteur affiché dans le pied (nom de l'utilisateur). */
  author?: string;
}

// Charte (valeurs hex des jetons du design system, thème clair).
const INK: [number, number, number] = [29, 26, 22];
const MUTED: [number, number, number] = [104, 97, 90];
const PRIMARY: [number, number, number] = [25, 72, 56];
const RULE: [number, number, number] = [220, 215, 207];
const ZEBRA: [number, number, number] = [249, 248, 245];
const MARGIN = 14; // mm

/**
 * Helvetica (police standard PDF) est encodée en WinAnsi : les espaces fines
 * produites par Intl (fr-FR) et quelques symboles n'y existent pas.
 */
function txt(v: PdfCell): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v)
    .replace(/[   ]/g, ' ')
    .replace(/→/g, '->')
    .replace(/≈/g, '~');
}

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function horodatage(d = new Date()) {
  return d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
}

/** Marque (toit + lignes du registre) dessinée en vectoriel. */
function drawMark(doc: jsPDF, x: number, y: number, size: number) {
  const s = size / 28;
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(2.2 * s);
  doc.setLineCap('round');
  doc.setLineJoin('round');
  doc.lines([[10.5 * s, -8.5 * s], [10.5 * s, 8.5 * s]], x + 3.5 * s, y + 12.5 * s, [1, 1], 'S', false);
  doc.line(x + 7.5 * s, y + 16 * s, x + 20.5 * s, y + 16 * s);
  doc.line(x + 7.5 * s, y + 20 * s, x + 20.5 * s, y + 20 * s);
  doc.line(x + 7.5 * s, y + 24 * s, x + 15.5 * s, y + 24 * s);
}

function drawHeader(doc: jsPDF, generatedAt: string) {
  const w = doc.internal.pageSize.getWidth();
  drawMark(doc, MARGIN, 8, 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text('Syndic Alpha', MARGIN + 10, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`Généré le ${generatedAt}`, w - MARGIN, 14, { align: 'right' });
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, 19, w - MARGIN, 19);
}

function drawFooters(doc: jsPDF, label: string) {
  const total = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, h - 12, w - MARGIN, h - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(txt(label), MARGIN, h - 7);
    doc.text(`Page ${i} / ${total}`, w - MARGIN, h - 7, { align: 'right' });
  }
}

/**
 * Rapport de liste (tableau filtré) : orientation automatique selon le
 * nombre de colonnes, en-tête répété sur chaque page.
 */
export async function generateListReport(report: ListReport): Promise<GeneratedDocument> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const landscape = report.columns.length > 5;
  const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const generatedAt = horodatage();
  const w = doc.internal.pageSize.getWidth();

  doc.setProperties({ title: report.title, creator: 'Syndic Alpha', author: report.author ?? 'Syndic Alpha' });

  // Bloc titre (première page)
  drawHeader(doc, generatedAt);
  let y = 30;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(txt(report.title), MARGIN, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const meta = [
    report.subtitle,
    `${report.rows.length} ligne${report.rows.length > 1 ? 's' : ''}`,
  ].filter(Boolean) as string[];
  doc.text(txt(meta.join(' · ')), MARGIN, y);
  if (report.filters?.length) {
    y += 5;
    const lines = doc.splitTextToSize(txt(`Filtres : ${report.filters.join(' · ')}`), w - 2 * MARGIN);
    doc.text(lines, MARGIN, y);
    y += (lines.length - 1) * 4;
  }

  autoTable(doc, {
    startY: y + 5,
    margin: { top: 24, left: MARGIN, right: MARGIN, bottom: 16 },
    head: [report.columns.map((c) => txt(c.header))],
    body: report.rows.map((r) => r.map(txt)),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: INK,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      lineColor: RULE,
      overflow: 'linebreak',
    },
    headStyles: { fontStyle: 'bold', textColor: MUTED, fillColor: ZEBRA, lineWidth: { bottom: 0.3 } },
    bodyStyles: { lineWidth: { bottom: 0.1 } },
    columnStyles: Object.fromEntries(
      report.columns.map((c, i) => [i, { halign: c.align === 'right' ? 'right' : 'left' }]),
    ),
    didParseCell: (data) => {
      if (data.section === 'head') {
        data.cell.styles.halign = report.columns[data.column.index]?.align === 'right' ? 'right' : 'left';
      }
    },
    // En-tête de marque sur les pages suivantes
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader(doc, generatedAt);
    },
  });

  drawFooters(doc, `Syndic Alpha · ${report.title}${report.author ? ` · ${report.author}` : ''}`);

  const date = new Date().toISOString().slice(0, 10);
  return { blob: doc.output('blob'), filename: `${slug(report.title)}-${date}.pdf` };
}
