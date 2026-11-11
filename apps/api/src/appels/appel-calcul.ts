// Calcul PUR des lignes d'un poste d'appel de fonds (aucune dépendance base/NestJS).
// Deux niveaux de répartition, tous deux en entiers exacts (somme préservée) :
//   1) le montant du poste est réparti entre les LOTS selon leurs tantièmes ;
//   2) la part de chaque lot est répartie entre ses REDEVABLES selon leurs quote-parts.

import { repartir } from '../common/repartition';
import { Fraction, fractionsToWeights } from '../common/fraction';

export interface TantiemeLot {
  lotId: string;
  valeur: number;
}

export interface RedevablePart extends Fraction {
  personneId: string;
}

export interface LigneCalc {
  lotId: string;
  redevableId: string;
  montant: bigint;
  tantiemeLot: number;
}

/**
 * @param montant            montant total du poste (entier)
 * @param tantiemes          tantièmes par lot (de la version de clé applicable)
 * @param redevablesParLot   pour chaque lot, ses redevables et leurs quote-parts
 * @throws si un lot chargé n'a aucun redevable identifié
 */
export function calculerLignes(
  montant: bigint,
  tantiemes: TantiemeLot[],
  redevablesParLot: Map<string, RedevablePart[]>,
): LigneCalc[] {
  // Niveau 1 : montant du poste → part de chaque lot (selon tantièmes).
  const partsLot = repartir(
    montant,
    tantiemes.map((t) => ({ id: t.lotId, tantieme: t.valeur })),
  );
  const tantiemeParLot = new Map(tantiemes.map((t) => [t.lotId, t.valeur]));

  const lignes: LigneCalc[] = [];

  for (const partLot of partsLot) {
    const redevables = redevablesParLot.get(partLot.id) ?? [];
    if (redevables.length === 0) {
      throw new Error(`Lot ${partLot.id} sans redevable identifié`);
    }

    // Niveau 2 : part du lot → part de chaque redevable (selon quote-parts).
    const poids = fractionsToWeights(redevables);
    const partsRedevable = repartir(
      partLot.montant,
      redevables.map((r, i) => ({ id: r.personneId, tantieme: poids[i] })),
    );

    for (const pr of partsRedevable) {
      lignes.push({
        lotId: partLot.id,
        redevableId: pr.id,
        montant: pr.montant,
        tantiemeLot: tantiemeParLot.get(partLot.id) ?? 0,
      });
    }
  }

  return lignes;
}
