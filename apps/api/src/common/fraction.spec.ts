import { isValidQuotePart, sumExceedsOne, intervalsOverlap } from './fraction';

describe('fraction — arithmétique exacte', () => {
  describe('isValidQuotePart', () => {
    it('accepte 1/3', () => expect(isValidQuotePart(1, 3)).toBe(true));
    it('accepte 1/1', () => expect(isValidQuotePart(1, 1)).toBe(true));
    it('refuse den = 0', () => expect(isValidQuotePart(1, 0)).toBe(false));
    it('refuse num > den (3/2)', () =>
      expect(isValidQuotePart(3, 2)).toBe(false));
    it('refuse num = 0', () => expect(isValidQuotePart(0, 3)).toBe(false));
    it('refuse non entier', () =>
      expect(isValidQuotePart(1.5, 3)).toBe(false));
  });

  describe('sumExceedsOne', () => {
    it('1/3 + 1/3 + 1/3 = 1 → ne dépasse pas (exact, pas de dérive flottante)', () => {
      expect(
        sumExceedsOne([
          { num: 1, den: 3 },
          { num: 1, den: 3 },
          { num: 1, den: 3 },
        ]),
      ).toBe(false);
    });
    it('1/2 + 1/2 = 1 → ne dépasse pas', () => {
      expect(
        sumExceedsOne([
          { num: 1, den: 2 },
          { num: 1, den: 2 },
        ]),
      ).toBe(false);
    });
    it('3/5 + 3/5 = 6/5 → dépasse', () => {
      expect(
        sumExceedsOne([
          { num: 3, den: 5 },
          { num: 3, den: 5 },
        ]),
      ).toBe(true);
    });
  });

  describe('intervalsOverlap', () => {
    const d = (s: string) => new Date(s);
    it('deux intervalles ouverts se chevauchent', () => {
      expect(
        intervalsOverlap(d('2026-01-01'), null, d('2026-06-01'), null),
      ).toBe(true);
    });
    it('périodes disjointes ne se chevauchent pas (half-open)', () => {
      expect(
        intervalsOverlap(
          d('2026-01-01'),
          d('2026-07-01'),
          d('2026-07-01'),
          null,
        ),
      ).toBe(false);
    });
    it('périodes qui se recouvrent', () => {
      expect(
        intervalsOverlap(
          d('2026-01-01'),
          d('2026-08-01'),
          d('2026-06-01'),
          d('2026-12-01'),
        ),
      ).toBe(true);
    });
  });
});
