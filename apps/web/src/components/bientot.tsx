import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/ui/states';
import { Button } from '@/components/ui/button';

// Module dont l'interface n'est pas encore livrée : message honnête + quoi faire en attendant.
export function Bientot({
  titre,
  description,
  steps,
}: {
  titre: string;
  description: string;
  steps?: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: 'Espace', href: '/dashboard' }, { label: titre }]} title={titre} />
      <EmptyState
        title="Module en préparation"
        steps={steps}
        actions={
          <Button asChild variant="secondary">
            <Link href="/coproprietes">Préparer mes copropriétés</Link>
          </Button>
        }
      >
        {description}
      </EmptyState>
    </div>
  );
}
