import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 aria-hidden className={cn('h-4 w-4 animate-spin', className)} />;
}

export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div role="status" className="flex h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner />
      {label}
    </div>
  );
}
