// Calcul PUR des impayés (aucune dépendance base/NestJS), facilement testable.
// Un impayé = une ligne d'appel VALIDÉ dont le solde (montant − affectations) > 0.

export interface LigneData {
  id: string;
  appelNumero: string;
  dateEcheance: Date;
  lotRef: string;
  montant: bigint;
  affecte: bigint;
  redevableId: string;
  redevableNom: string;
  redevablePrenom?: string | null;
}

export interface ImpayeLigne {
  ligneId: string;
  appelNumero: string;
  lotRef: string;
  montant: bigint;
  paye: bigint;
  solde: bigint;
  dateEcheance: Date;
  joursRetard: number;
}

export interface ImpayePersonne {
  personneId: string;
  nom: string;
  prenom?: string | null;
  solde: bigint;
  joursRetardMax: number;
  lignes: ImpayeLigne[];
}

const JOUR_MS = 24 * 60 * 60 * 1000;

export function joursDeRetard(dateEcheance: Date, today: Date): number {
  const diff = Math.floor((today.getTime() - dateEcheance.getTime()) / JOUR_MS);
  return diff > 0 ? diff : 0;
}

export function calculerImpayes(
  lignes: LigneData[],
  today: Date,
): ImpayePersonne[] {
  const parPersonne = new Map<string, ImpayePersonne>();

  for (const l of lignes) {
    const solde = l.montant - l.affecte;
    if (solde <= 0n) continue; // ligne soldée → pas un impayé (RG-38)

    const retard = joursDeRetard(l.dateEcheance, today);

    let entree = parPersonne.get(l.redevableId);
    if (!entree) {
      entree = {
        personneId: l.redevableId,
        nom: l.redevableNom,
        prenom: l.redevablePrenom,
        solde: 0n,
        joursRetardMax: 0,
        lignes: [],
      };
      parPersonne.set(l.redevableId, entree);
    }

    entree.solde += solde;
    entree.joursRetardMax = Math.max(entree.joursRetardMax, retard);
    entree.lignes.push({
      ligneId: l.id,
      appelNumero: l.appelNumero,
      lotRef: l.lotRef,
      montant: l.montant,
      paye: l.affecte,
      solde,
      dateEcheance: l.dateEcheance,
      joursRetard: retard,
    });
  }

  // Tri : plus gros soldes d'abord.
  return [...parPersonne.values()].sort((a, b) =>
    a.solde > b.solde ? -1 : a.solde < b.solde ? 1 : 0,
  );
}
