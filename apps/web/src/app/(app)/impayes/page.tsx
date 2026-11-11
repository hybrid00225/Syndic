import { Bientot } from '@/components/bientot';

export default function Page() {
  return (
    <Bientot
      titre="Impayés"
      description="Le suivi des impayés listera, par copropriétaire, les appels non soldés, leur ancienneté et les relances envoyées. Il s'appuiera sur les appels de fonds et les encaissements."
      steps={[
        'Émettre des appels de fonds',
        'Enregistrer les encaissements',
        'Suivre et relancer les soldes (bientôt)',
      ]}
    />
  );
}
