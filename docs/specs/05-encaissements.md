# Spec module 05 — Encaissements & paiements

> Enregistrer les **paiements** reçus et les **affecter** aux dettes (lignes d'appel). Règle d'or : **paiement ≠ affectation**.
> Source : `analyse.md` domaine 10. Statut : 🟨 en revue.

---

## 1. Entités

- **Paiement** : `payeurId`, `dateOperation`, `montant` (entier), `moyen` (ESPECES, CHEQUE, VIREMENT, CARTE, MOBILE_MONEY, PRELEVEMENT, EN_LIGNE), `referenceBancaire?`, `statut` (EN_ATTENTE/VALIDE/REJETE/ANNULE), `idempotencyKey?` (unique).
- **AffectationPaiement** : impute une partie d'un paiement (`montantAffecte`) à une **ligne d'appel**. Opération **séparée** du paiement.

---

## 2. Règles de gestion

1. **RG-30** **Paiement ≠ affectation** : un paiement est d'abord *reçu*, puis *affecté* (éventuellement plus tard, en plusieurs fois, à plusieurs lignes).
2. **RG-31** Le payeur est une personne du **même syndic** que la copropriété. Sinon → 400.
3. **RG-32** `montant > 0`.
4. **RG-33** **Idempotence Mobile Money** : si un `idempotencyKey` est fourni et déjà connu, on **ne crée pas** un 2ᵉ paiement → on renvoie l'existant. Empêche le double-comptage sur re-notification du fournisseur.
5. **RG-34** La somme des affectations d'un **paiement** ne dépasse pas son `montant`. Le reste non affecté = **avance / crédit** du payeur.
6. **RG-35** La somme des affectations sur une **ligne** ne dépasse pas son `montant` (le solde dû = `montant − Σ affectations`).
7. **RG-36** Isolation : la ligne affectée appartient à un appel de **la même copropriété** que le paiement. Sinon → 400.
8. **RG-37** Un paiement validé n'est pas *supprimé* ; l'**annulation** (→ ANNULE) retire ses affectations (transaction). Seul un paiement `VALIDE` peut être affecté.

---

## 3. Endpoints

| Méthode | Route | Action |
|---|---|---|
| POST | `/coproprietes/:coproprieteId/paiements` | enregistrer un paiement (idempotent si `idempotencyKey`) |
| GET | `/coproprietes/:coproprieteId/paiements` | lister |
| GET | `/paiements/:id` | détail (+ montant affecté, reste/avance) |
| POST | `/paiements/:paiementId/affectations` | affecter à une ligne `{ ligneAppelId, montantAffecte }` |
| DELETE | `/affectations/:id` | désaffecter (correction) |
| PATCH | `/paiements/:id/annuler` | → ANNULE (retire les affectations) |

---

## 4. Cas à couvrir (tests)

- Même `idempotencyKey` deux fois → **un seul** paiement (RG-33).
- Payeur d'un autre syndic → 400 (RG-31).
- Affecter plus que le reste du paiement → 400 (RG-34).
- Affecter plus que le dû de la ligne → 400 (RG-35).
- Affectation valide → crée l'affectation.
- Paiement partiel puis complément sur la même ligne → OK jusqu'au solde.

---

## 5. Hors périmètre (slices suivantes)

- Reçu PDF → slice PDF.
- Impayés & relances (liste des lignes à solde > 0, jours de retard) → module 06.
- Affectation **automatique**, trop-perçu transformé en avance exploitable, remboursements → ultérieur.
- Webhook Mobile Money réel (le module expose l'idempotence ; l'intégration fournisseur viendra).
