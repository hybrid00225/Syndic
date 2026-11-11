import { calculerImpayes, joursDeRetard, LigneData } from './recouvrement-calcul';

const ligne = (over: Partial<LigneData>): LigneData => ({
  id: 'l',
  appelNumero: 'AF-2026-0001',
  dateEcheance: new Date('2026-04-01'),
  lotRef: 'A101',
  montant: 100_000n,
  affecte: 0n,
  redevableId: 'A',
  redevableNom: 'Koné',
  redevablePrenom: 'Awa',
  ...over,
});

describe('joursDeRetard', () => {
  it('compte les jours écoulés depuis l’échéance', () => {
    expect(
      joursDeRetard(new Date('2026-04-01'), new Date('2026-04-11')),
    ).toBe(10);
  });
  it('0 si l’échéance est future', () => {
    expect(
      joursDeRetard(new Date('2026-12-01'), new Date('2026-04-11')),
    ).toBe(0);
  });
});

describe('calculerImpayes', () => {
  const today = new Date('2026-05-01');

  it('ignore une ligne entièrement payée', () => {
    const r = calculerImpayes([ligne({ affecte: 100_000n })], today);
    expect(r).toHaveLength(0);
  });

  it('une ligne partiellement payée apparaît avec le solde restant', () => {
    const r = calculerImpayes([ligne({ affecte: 30_000n })], today);
    expect(r).toHaveLength(1);
    expect(r[0].solde).toBe(70_000n);
    expect(r[0].lignes[0].paye).toBe(30_000n);
  });

  it('regroupe plusieurs lignes par copropriétaire', () => {
    const r = calculerImpayes(
      [
        ligne({ id: 'l1', montant: 100_000n, affecte: 0n }),
        ligne({ id: 'l2', montant: 50_000n, affecte: 0n, lotRef: 'A102' }),
      ],
      today,
    );
    expect(r).toHaveLength(1);
    expect(r[0].solde).toBe(150_000n);
    expect(r[0].lignes).toHaveLength(2);
  });

  it('calcule le retard max et trie par solde décroissant', () => {
    const r = calculerImpayes(
      [
        ligne({ id: 'l1', redevableId: 'A', montant: 50_000n }),
        ligne({
          id: 'l2',
          redevableId: 'B',
          redevableNom: 'Traoré',
          montant: 200_000n,
          dateEcheance: new Date('2026-01-01'),
        }),
      ],
      today,
    );
    expect(r[0].personneId).toBe('B'); // plus gros solde en tête
    expect(r[0].joursRetardMax).toBeGreaterThan(r[1].joursRetardMax);
  });
});
