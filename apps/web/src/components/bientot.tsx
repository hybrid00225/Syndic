import { Card, CardContent } from '@/components/ui/card';
import { Hammer } from 'lucide-react';

export function Bientot({ titre }: { titre: string }) {
  return (
    <div className="animate-fade-up space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{titre}</h1>
      <Card>
        <CardContent className="flex flex-col items-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
            <Hammer className="h-7 w-7" />
          </div>
          <p className="mt-4 font-medium">Écran en préparation</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Le backend de ce module est déjà prêt et testé. L&apos;interface
            arrive dans une prochaine itération.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
