// Répartition d'un montant ENTIER selon des tantièmes, avec somme exacte.
// Méthode du plus fort reste (largest remainder) : on attribue d'abord la part
// entière (plancher) à chacun, puis on distribue les unités restantes aux plus
// gros restes. Garantit : Σ parts = montant, exactement, sans virgule.

export interface PartTantieme {
  id: string; // identifiant du lot (ou de la ligne)
  tantieme: number; // tantièmes du lot pour cette clé
}

export interface Allocation {
  id: string;
  montant: bigint;
}

export function repartir(montant: bigint, parts: PartTantieme[]): Allocation[] {
  const total = parts.reduce((acc, p) => acc + BigInt(p.tantieme), 0n);
  if (total <= 0n) {
    throw new Error('Le total des tantièmes doit être strictement positif');
  }

  // Part plancher + reste pour chaque élément.
  const calcules = parts.map((p) => {
    const produit = montant * BigInt(p.tantieme);
    return {
      id: p.id,
      base: produit / total, // division entière (plancher)
      reste: produit % total, // reste pour départager
    };
  });

  const sommeBase = calcules.reduce((acc, c) => acc + c.base, 0n);
  let unitesRestantes = montant - sommeBase; // nombre d'unités à redistribuer

  // Les plus gros restes reçoivent +1 en priorité (ordre stable sur l'index).
  const ordre = [...calcules.keys()].sort((a, b) => {
    if (calcules[a].reste > calcules[b].reste) return -1;
    if (calcules[a].reste < calcules[b].reste) return 1;
    return a - b;
  });

  const bonus = new Set<number>();
  for (const idx of ordre) {
    if (unitesRestantes <= 0n) break;
    bonus.add(idx);
    unitesRestantes -= 1n;
  }

  return calcules.map((c, i) => ({
    id: c.id,
    montant: c.base + (bonus.has(i) ? 1n : 0n),
  }));
}
