// Arithmétique de fractions EXACTE (numérateur/dénominateur entiers).
// Aucune conversion en décimal : les quote-parts de propriété doivent être justes
// (ex. 1/3 + 1/3 + 1/3 = 1, ce qui serait faux en virgule flottante).

export interface Fraction {
  num: number;
  den: number;
}

/** Quote-part valide : entiers, den > 0, et 0 < num/den ≤ 1. */
export function isValidQuotePart(num: number, den: number): boolean {
  return (
    Number.isInteger(num) &&
    Number.isInteger(den) &&
    den > 0 &&
    num > 0 &&
    num <= den
  );
}

/**
 * Vrai si la somme des fractions dépasse STRICTEMENT 1.
 * Calcul en BigInt pour rester exact même avec de grands dénominateurs.
 */
export function sumExceedsOne(fractions: Fraction[]): boolean {
  let accNum = 0n;
  let accDen = 1n;
  for (const f of fractions) {
    const n = BigInt(f.num);
    const d = BigInt(f.den);
    // a/b + n/d = (a*d + n*b) / (b*d)
    accNum = accNum * d + n * accDen;
    accDen = accDen * d;
  }
  // accNum/accDen > 1  ⇔  accNum > accDen   (accDen > 0)
  return accNum > accDen;
}

/**
 * Deux intervalles [start, end) se chevauchent-ils ?
 * end = null signifie « ouvert » (en cours, +∞).
 */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null,
): boolean {
  const aEndT = aEnd ? aEnd.getTime() : Infinity;
  const bEndT = bEnd ? bEnd.getTime() : Infinity;
  return aStart.getTime() < bEndT && bStart.getTime() < aEndT;
}
