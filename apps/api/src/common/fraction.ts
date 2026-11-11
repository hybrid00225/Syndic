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

/** PGCD (BigInt, valeurs positives). */
export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}

/** PPCM (BigInt). */
export function lcm(a: bigint, b: bigint): bigint {
  return (a / gcd(a, b)) * b;
}

/**
 * Convertit une liste de fractions en poids ENTIERS comparables,
 * en les ramenant au dénominateur commun (PPCM). Ex. [1/2, 1/3] → [3n, 2n].
 * Sert à répartir la charge d'un lot entre ses détenteurs selon leurs quote-parts.
 */
export function fractionsToWeights(fractions: Fraction[]): bigint[] {
  const denCommun = fractions.reduce(
    (acc, f) => lcm(acc, BigInt(f.den)),
    1n,
  );
  return fractions.map((f) => BigInt(f.num) * (denCommun / BigInt(f.den)));
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
