import { deriveAudit } from './audit-derive';

describe('deriveAudit', () => {
  it('POST /coproprietes → Copropriete / CREATE', () => {
    expect(deriveAudit('POST', '/coproprietes')).toEqual({
      entite: 'Copropriete',
      action: 'CREATE',
    });
  });

  it('POST /coproprietes/:coproprieteId/appels → AppelDeFonds / CREATE', () => {
    expect(deriveAudit('POST', '/coproprietes/:coproprieteId/appels')).toEqual({
      entite: 'AppelDeFonds',
      action: 'CREATE',
    });
  });

  it('PATCH /appels/:id/valider → AppelDeFonds / VALIDATE', () => {
    expect(deriveAudit('PATCH', '/appels/:id/valider')).toEqual({
      entite: 'AppelDeFonds',
      action: 'VALIDATE',
    });
  });

  it('PATCH /paiements/:id/annuler → Paiement / CANCEL', () => {
    expect(deriveAudit('PATCH', '/paiements/:id/annuler')).toEqual({
      entite: 'Paiement',
      action: 'CANCEL',
    });
  });

  it('DELETE /affectations/:id → AffectationPaiement / DELETE', () => {
    expect(deriveAudit('DELETE', '/affectations/:id')).toEqual({
      entite: 'AffectationPaiement',
      action: 'DELETE',
    });
  });

  it('POST /paiements/:paiementId/affectations → AffectationPaiement / CREATE', () => {
    expect(
      deriveAudit('POST', '/paiements/:paiementId/affectations'),
    ).toEqual({ entite: 'AffectationPaiement', action: 'CREATE' });
  });
});
