import { cn } from '@/lib/utils';

// Tableau registre : filets horizontaux, en-têtes sobres, chiffres à droite.
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border bg-card', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap border-b border-border px-4 py-2.5 text-left text-ui font-medium text-muted-foreground',
        numeric && 'text-right',
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('border-b border-border last:border-b-0 transition-colors hover:bg-muted/40', className)}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn('px-4 py-3 align-middle', numeric && 'nums text-right', className)}
      {...props}
    />
  );
}
