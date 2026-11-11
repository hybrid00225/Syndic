import { LucideIcon } from 'lucide-react';
import { Card } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

interface StatTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconClass?: string;
  hint?: string;
  trend?: { value: string; tone: 'success' | 'danger' | 'neutral' };
}

export function StatTile({
  label,
  value,
  icon: Icon,
  iconClass = 'bg-primary/10 text-primary',
  hint,
  trend,
}: StatTileProps) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg',
            iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight nums">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2">
        {trend && (
          <Badge tone={trend.tone === 'neutral' ? 'neutral' : trend.tone}>
            {trend.value}
          </Badge>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
