'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Columns3, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { exportCsv } from '@/lib/csv';
import { generateListReport } from '@/lib/pdf';
import { cn } from '@/lib/utils';
import { Table, Td, Th, Tr } from './table';
import { Pagination, usePaged } from './list';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { Popover } from './popover';
import { SearchSelect } from './select';
import { useDocumentPreview } from './document-preview';

/*
 * Grandes listes de données : un seul moteur pour toute l'application.
 *  - useDataTable : tri, colonnes visibles, pagination (mémorisés par tableau) ;
 *  - <DataTable> : rendu (en-têtes triables, lignes cliquables, actions) ;
 *  - <ColumnsMenu> : afficher / masquer des colonnes ;
 *  - <TableExport> : Imprimer / Exporter (PDF, CSV) des lignes filtrées et
 *    triées, avec les seules colonnes visibles.
 */

export type CellValue = string | number | Date | null | undefined;
export type SortDir = 'asc' | 'desc';
type Sort = { id: string; dir: SortDir } | null;

export interface Column<T> {
  id: string;
  header: string;
  /** Rendu dans le tableau. */
  cell: (row: T) => React.ReactNode;
  /** Valeur brute : tri et exports. */
  value: (row: T) => CellValue;
  /** Texte exporté s'il diffère de la valeur (ex. libellé d'un statut). */
  exportValue?: (row: T) => string | number | null | undefined;
  /** Triable (oui par défaut). */
  sortable?: boolean;
  /** Montants, quantités : aligné à droite. */
  numeric?: boolean;
  /** Colonne complémentaire, masquée tant que l'utilisateur ne l'affiche pas. */
  defaultHidden?: boolean;
  /** Toujours affichée (identifiant de la ligne). */
  required?: boolean;
  className?: string;
}

interface Stored {
  /** Choix explicites de l'utilisateur (les autres colonnes suivent leur défaut). */
  cols?: Record<string, boolean>;
  sort?: Sort;
  pageSize?: number;
}

const storageKey = (id: string) => `syndic_alpha_table:${id}`;

function readStored(id: string): Stored {
  try {
    const v = JSON.parse(localStorage.getItem(storageKey(id)) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });

function compare(a: CellValue, b: CellValue) {
  // Valeurs vides toujours en fin de liste, quel que soit le sens.
  const ea = a === null || a === undefined || a === '';
  const eb = b === null || b === undefined || b === '';
  if (ea || eb) return ea === eb ? 0 : ea ? 1 : -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return collator.compare(String(a), String(b));
}

/** Texte d'une cellule pour l'export (dates et nombres au format français). */
function exportText<T>(col: Column<T>, row: T, mode: 'pdf' | 'csv'): string | number {
  const v = col.exportValue ? col.exportValue(row) : col.value(row);
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toLocaleDateString('fr-FR');
  // CSV : virgule décimale, sans séparateur de milliers (Excel en français, séparateur « ; »).
  if (typeof v === 'number') return mode === 'pdf' ? v.toLocaleString('fr-FR') : String(v).replace('.', ',');
  return v;
}

export function useDataTable<T>({
  id,
  rows,
  columns,
  defaultSort = null,
  resetKey,
}: {
  /** Clé de mémorisation (unique par tableau). */
  id: string;
  /** Lignes déjà filtrées par la page. */
  rows: T[];
  columns: Column<T>[];
  defaultSort?: Sort;
  /** Change quand les filtres changent (retour à la page 1). */
  resetKey: unknown;
}) {
  const [stored] = useState<Stored>(() => readStored(id));
  const [cols, setCols] = useState<Record<string, boolean>>(stored.cols ?? {});
  const [sort, setSort] = useState<Sort>(
    stored.sort === undefined || (stored.sort && !columns.some((c) => c.id === stored.sort!.id))
      ? defaultSort
      : stored.sort,
  );

  const isVisible = (c: Column<T>) => c.required || (cols[c.id] ?? !c.defaultHidden);
  const visible = columns.filter(isVisible);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.id === sort.id);
    if (!col) return rows;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return rows
      .map((row, i) => ({ row, i, v: col.value(row) }))
      .sort((a, b) => {
        const empty = (x: CellValue) => x === null || x === undefined || x === '';
        // Vides en fin, sans inversion par le sens du tri.
        if (empty(a.v) || empty(b.v)) return compare(a.v, b.v) || a.i - b.i;
        return compare(a.v, b.v) * factor || a.i - b.i;
      })
      .map((x) => x.row);
  }, [rows, columns, sort]);

  const paged = usePaged(sorted, stored.pageSize ?? 10, `${String(resetKey)}|${sort?.id}|${sort?.dir}`);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({ cols, sort, pageSize: paged.pageSize }));
    } catch {
      /* stockage indisponible */
    }
  }, [id, cols, sort, paged.pageSize]);

  return {
    columns,
    visible,
    isVisible,
    sort,
    sorted,
    paged,
    /** Croissant → décroissant → tri par défaut. */
    toggleSort(colId: string) {
      setSort((s) =>
        s?.id !== colId ? { id: colId, dir: 'asc' } : s.dir === 'asc' ? { id: colId, dir: 'desc' } : defaultSort,
      );
    },
    setSort,
    toggleColumn(colId: string) {
      const col = columns.find((c) => c.id === colId);
      if (!col || col.required) return;
      setCols((c) => ({ ...c, [colId]: !isVisible(col) }));
    },
    showAllColumns: () => setCols(Object.fromEntries(columns.map((c) => [c.id, true]))),
    resetColumns: () => setCols({}),
    /** En-têtes + lignes exportables (lignes filtrées et triées, colonnes visibles). */
    exportRows(mode: 'pdf' | 'csv') {
      return {
        columns: visible.map((c) => ({ header: c.header, align: c.numeric ? ('right' as const) : ('left' as const) })),
        rows: sorted.map((r) => visible.map((c) => exportText(c, r, mode))),
      };
    },
  };
}

export type DataTableState<T> = ReturnType<typeof useDataTable<T>>;

/** Tableau de données : en-têtes triables, pagination, actions de ligne. */
export function DataTable<T>({
  table,
  rowKey,
  rowHref,
  onRowOpen,
  rowActions,
}: {
  table: DataTableState<T>;
  rowKey: (row: T) => string;
  /** Ligne entière cliquable vers cette page. */
  rowHref?: (row: T) => string;
  /** Ligne cliquable sans page cible (aperçu). */
  onRowOpen?: (row: T) => void;
  rowActions?: (row: T) => React.ReactNode;
}) {
  const { visible, sort, paged } = table;
  return (
    <Table footer={<Pagination {...paged} />}>
      <thead className="bg-background/60">
        <tr>
          {visible.map((c) => {
            const sortable = c.sortable !== false;
            const active = sort?.id === c.id;
            const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
            return (
              <Th
                key={c.id}
                numeric={c.numeric}
                aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                className={c.className}
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={() => table.toggleSort(c.id)}
                    className={cn(
                      'group/sort -mx-1 inline-flex items-center gap-1 rounded-sm px-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                      c.numeric && 'flex-row-reverse',
                      active && 'text-foreground',
                    )}
                  >
                    {c.header}
                    <Icon
                      aria-hidden
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-opacity',
                        active ? 'opacity-100' : 'opacity-30 group-hover/sort:opacity-70',
                      )}
                    />
                  </button>
                ) : (
                  c.header
                )}
              </Th>
            );
          })}
          {rowActions && (
            <Th className="no-print w-[1%]">
              <span className="sr-only">Actions</span>
            </Th>
          )}
        </tr>
      </thead>
      <tbody>
        {paged.pageItems.map((row) => (
          <Tr
            key={rowKey(row)}
            href={rowHref?.(row)}
            onOpen={onRowOpen ? () => onRowOpen(row) : undefined}
          >
            {visible.map((c) => (
              <Td key={c.id} numeric={c.numeric}>
                {c.cell(row)}
              </Td>
            ))}
            {rowActions && <Td>{rowActions(row)}</Td>}
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Menu « Colonnes » : choisir les informations affichées (et exportées). */
export function ColumnsMenu<T>({ table }: { table: DataTableState<T> }) {
  const hiddenCount = table.columns.length - table.visible.length;
  return (
    <Popover
      trigger={(props) => (
        <Button variant="secondary" size="sm" {...props}>
          <Columns3 aria-hidden className="h-4 w-4" />
          Colonnes
          {hiddenCount > 0 && (
            <span className="nums rounded-full bg-muted px-1.5 text-2xs text-muted-foreground">
              +{hiddenCount}
            </span>
          )}
        </Button>
      )}
    >
      {() => (
        <div role="group" aria-label="Colonnes affichées">
          <p className="border-b border-border px-3 py-2.5 text-2xs text-muted-foreground">
            Colonnes affichées (et exportées)
          </p>
          <ul className="max-h-72 space-y-0.5 overflow-y-auto p-1.5">
            {table.columns.map((c) => (
              <li key={c.id}>
                <Checkbox
                  label={c.header}
                  checked={table.isVisible(c)}
                  disabled={c.required}
                  onChange={() => table.toggleColumn(c.id)}
                  className="w-full rounded-md px-2 py-1.5 text-ui hover:bg-muted"
                />
              </li>
            ))}
          </ul>
          <div className="flex justify-between gap-2 border-t border-border bg-muted/40 px-2 py-1.5">
            <Button variant="ghost" size="sm" onClick={table.resetColumns}>
              Par défaut
            </Button>
            <Button variant="ghost" size="sm" onClick={table.showAllColumns}>
              Tout afficher
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
}

/** Tri par liste déroulante (vue en cartes, sans en-têtes de colonnes). */
export function SortSelect<T>({ table }: { table: DataTableState<T> }) {
  const options = table.columns
    .filter((c) => c.sortable !== false)
    .flatMap((c) => [
      [`${c.id}:asc`, `${c.header} ↑`],
      [`${c.id}:desc`, `${c.header} ↓`],
    ] as const);
  const value = table.sort ? `${table.sort.id}:${table.sort.dir}` : '';
  return (
    <SearchSelect
      size="sm"
      className="w-48"
      aria-label="Trier"
      value={value}
      onChange={(v) => {
        const [id, dir] = v.split(':');
        table.setSort(id ? { id, dir: dir as SortDir } : null);
      }}
      options={options}
      allowEmpty
      emptyLabel="Tri par défaut"
    />
  );
}

/**
 * Boutons Imprimer / Exporter d'une liste. Portent sur les lignes filtrées et
 * triées, avec les colonnes visibles. Le PDF passe toujours par l'aperçu.
 */
export function TableExport<T>({
  table,
  title,
  subtitle,
  filters,
  filename,
}: {
  table: DataTableState<T>;
  /** Titre du document (ex. « Copropriétés »). */
  title: string;
  subtitle?: string;
  /** Filtres actifs, lisibles : « Statut : Active ». */
  filters: string[];
  /** Nom de base des fichiers (sans extension). */
  filename: string;
}) {
  const preview = useDocumentPreview();
  const { user } = useAuth();
  const empty = table.sorted.length === 0;

  const pdf = () =>
    preview({
      title,
      description: `${table.sorted.length} ligne${table.sorted.length > 1 ? 's' : ''} · ${table.visible.length} colonne${table.visible.length > 1 ? 's' : ''}${filters.length ? ' · filtrée' : ''}`,
      load: () => generateListReport({ title, subtitle, filters, author: user?.nom, ...table.exportRows('pdf') }),
    });

  const csv = () => {
    const { columns, rows } = table.exportRows('csv');
    exportCsv(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, columns.map((c) => c.header), rows);
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={pdf} disabled={empty}>
        <Printer aria-hidden className="h-4 w-4" /> Imprimer
      </Button>
      <Popover
        trigger={(props) => (
          <Button variant="secondary" size="sm" disabled={empty} {...props}>
            <Download aria-hidden className="h-4 w-4" /> Exporter
          </Button>
        )}
      >
        {(close) => (
          <div role="menu" className="p-1">
            <p className="px-2.5 pb-1.5 pt-1 text-2xs text-muted-foreground">
              Lignes filtrées et colonnes affichées
            </p>
            <MenuButton
              icon={FileText}
              label="PDF"
              hint="Aperçu avant téléchargement"
              onClick={() => {
                close();
                pdf();
              }}
            />
            <MenuButton
              icon={FileSpreadsheet}
              label="Excel (CSV)"
              hint="Ouvre dans Excel, LibreOffice…"
              onClick={() => {
                close();
                csv();
              }}
            />
          </div>
        )}
      </Popover>
    </>
  );
}

function MenuButton({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <span>
        <span className="block text-ui font-medium">{label}</span>
        <span className="block text-2xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
