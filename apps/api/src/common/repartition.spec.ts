import { repartir } from './repartition';

describe('repartir — répartition entière exacte (plus fort reste)', () => {
  const somme = (allocs: { montant: bigint }[]) =>
    allocs.reduce((acc, a) => acc + a.montant, 0n);

  it('100 sur tantièmes 1/1/1 → 34 + 33 + 33 = 100', () => {
    const r = repartir(100n, [
      { id: 'a', tantieme: 1 },
      { id: 'b', tantieme: 1 },
      { id: 'c', tantieme: 1 },
    ]);
    expect(r.map((x) => x.montant)).toEqual([34n, 33n, 33n]);
    expect(somme(r)).toBe(100n);
  });

  it('répartition proportionnelle 600 sur 50/30/20', () => {
    const r = repartir(600n, [
      { id: 'a', tantieme: 50 },
      { id: 'b', tantieme: 30 },
      { id: 'c', tantieme: 20 },
    ]);
    expect(r.map((x) => x.montant)).toEqual([300n, 180n, 120n]);
    expect(somme(r)).toBe(600n);
  });

  it('la somme est toujours exacte, même avec des restes (1000 sur 1/1/1)', () => {
    const r = repartir(1000n, [
      { id: 'a', tantieme: 1 },
      { id: 'b', tantieme: 1 },
      { id: 'c', tantieme: 1 },
    ]);
    expect(somme(r)).toBe(1000n);
    // 334 + 333 + 333
    expect(r.map((x) => x.montant)).toEqual([334n, 333n, 333n]);
  });

  it('gros montant réaliste : 10 000 000 FCFA sur 3 lots inégaux', () => {
    const r = repartir(10_000_000n, [
      { id: 'a', tantieme: 7 },
      { id: 'b', tantieme: 2 },
      { id: 'c', tantieme: 1 },
    ]);
    expect(somme(r)).toBe(10_000_000n);
  });

  it('refuse un total de tantièmes nul', () => {
    expect(() => repartir(100n, [{ id: 'a', tantieme: 0 }])).toThrow();
  });
});
