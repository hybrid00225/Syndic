import { calculerLignes, RedevablePart } from './appel-calcul';
import { fractionsToWeights } from '../common/fraction';

const pp = (personneId: string, num: number, den: number): RedevablePart => ({
  personneId,
  num,
  den,
});

describe('fractionsToWeights', () => {
  it('[1/2, 1/2] → [1, 1]', () =>
    expect(fractionsToWeights([{ num: 1, den: 2 }, { num: 1, den: 2 }])).toEqual([
      1n,
      1n,
    ]));
  it('[1/3, 2/3] → [1, 2]', () =>
    expect(fractionsToWeights([{ num: 1, den: 3 }, { num: 2, den: 3 }])).toEqual([
      1n,
      2n,
    ]));
  it('[1/2, 1/3] → [3, 2] (dénominateur commun 6)', () =>
    expect(fractionsToWeights([{ num: 1, den: 2 }, { num: 1, den: 3 }])).toEqual([
      3n,
      2n,
    ]));
});

describe('calculerLignes — génération des lignes d’appel', () => {
  const sommeMontants = (lignes: { montant: bigint }[]) =>
    lignes.reduce((acc, l) => acc + l.montant, 0n);

  it('un lot, un propriétaire plein : tout lui revient', () => {
    const lignes = calculerLignes(
      100_000n,
      [{ lotId: 'L1', valeur: 10 }],
      new Map([['L1', [pp('A', 1, 1)]]]),
    );
    expect(lignes).toEqual([
      { lotId: 'L1', redevableId: 'A', montant: 100_000n, tantiemeLot: 10 },
    ]);
  });

  it('deux lots 50/50 : montant réparti par tantièmes', () => {
    const lignes = calculerLignes(
      1_000n,
      [
        { lotId: 'L1', valeur: 50 },
        { lotId: 'L2', valeur: 50 },
      ],
      new Map([
        ['L1', [pp('A', 1, 1)]],
        ['L2', [pp('B', 1, 1)]],
      ]),
    );
    expect(lignes.find((l) => l.lotId === 'L1')!.montant).toBe(500n);
    expect(lignes.find((l) => l.lotId === 'L2')!.montant).toBe(500n);
    expect(sommeMontants(lignes)).toBe(1_000n);
  });

  it('indivision 1/2 + 1/2 sur un lot : part du lot partagée', () => {
    const lignes = calculerLignes(
      1_000n,
      [{ lotId: 'L1', valeur: 1 }],
      new Map([['L1', [pp('A', 1, 2), pp('B', 1, 2)]]]),
    );
    expect(lignes).toHaveLength(2);
    expect(lignes[0].montant).toBe(500n);
    expect(lignes[1].montant).toBe(500n);
    expect(sommeMontants(lignes)).toBe(1_000n);
  });

  it('somme toujours exacte : 100 sur 3 lots 1/1/1', () => {
    const lignes = calculerLignes(
      100n,
      [
        { lotId: 'L1', valeur: 1 },
        { lotId: 'L2', valeur: 1 },
        { lotId: 'L3', valeur: 1 },
      ],
      new Map([
        ['L1', [pp('A', 1, 1)]],
        ['L2', [pp('B', 1, 1)]],
        ['L3', [pp('C', 1, 1)]],
      ]),
    );
    expect(lignes.map((l) => l.montant)).toEqual([34n, 33n, 33n]);
    expect(sommeMontants(lignes)).toBe(100n);
  });

  it('indivision 1/3 + 2/3 : répartition proportionnelle exacte', () => {
    const lignes = calculerLignes(
      900n,
      [{ lotId: 'L1', valeur: 1 }],
      new Map([['L1', [pp('A', 1, 3), pp('B', 2, 3)]]]),
    );
    expect(lignes.find((l) => l.redevableId === 'A')!.montant).toBe(300n);
    expect(lignes.find((l) => l.redevableId === 'B')!.montant).toBe(600n);
    expect(sommeMontants(lignes)).toBe(900n);
  });

  it('lève une erreur si un lot chargé n’a aucun redevable', () => {
    expect(() =>
      calculerLignes(100n, [{ lotId: 'L1', valeur: 1 }], new Map()),
    ).toThrow();
  });
});
