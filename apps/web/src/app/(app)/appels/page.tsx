import { Bientot } from '@/components/bientot';

export default function Page() {
  return (
    <Bientot
      titre="Appels de fonds"
      description="Les appels de fonds répartissent le budget voté entre les lots selon leurs tantièmes. Le calcul est prêt côté serveur ; l'écran de génération arrive dans une prochaine itération."
      steps={[
        'Créer la copropriété et sa devise',
        'Saisir bâtiments, niveaux et lots',
        'Rattacher chaque lot à ses copropriétaires',
        'Générer l’appel de fonds (bientôt)',
      ]}
    />
  );
}
