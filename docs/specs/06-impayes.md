# Spec module 06 — Impayés & recouvrement

> Suivi des **soldes impayés** (calculés depuis les affectations) et historique des **relances**.
> Source : `analyse.md` domaine 11. Statut : 🟨 en revue. **Dernière brique métier du MVP.**

---

## 1. Principe

Pas de table « dette » : le solde d'une ligne d'appel se **calcule** →
`solde = montant − Σ affectations`. Un impayé = une ligne (d'un appel **validé**) à solde > 0.

On historise seulement les **relances** (table `Relance`).

---

## 2. Règles de gestion

1. **RG-38** Solde d'une ligne = `montant − Σ affectations`. Impayé si > 0.
2. **RG-39** Jours de retard = `max(0, aujourd'hui − dateEcheance)` (en jours).
3. **RG-40** Seuls les appels **VALIDE** comptent (BROUILLON/ANNULE exclus).
4. **RG-41** Une relance fige le `montantReclame` (solde du copropriétaire à l'instant), + `niveau` + `canal`.
5. **RG-42** Isolation : tout est scoping copropriété.

---

## 3. Endpoints

| Méthode | Route | Action |
|---|---|---|
| GET | `/coproprietes/:coproprieteId/impayes` | impayés groupés par copropriétaire (solde, jours de retard max, détail par ligne) |
| GET | `/coproprietes/:coproprieteId/personnes/:personneId/situation` | situation d'un copropriétaire (dû, payé, solde, avances) |
| POST | `/coproprietes/:coproprieteId/personnes/:personneId/relances` | enregistrer une relance `{ niveau?, canal, commentaire? }` |
| GET | `/coproprietes/:coproprieteId/personnes/:personneId/relances` | historique des relances |

---

## 4. Cas à couvrir (tests)

- Ligne entièrement payée → pas d'impayé.
- Ligne partiellement payée → solde = reste, apparaît en impayé.
- Regroupement par copropriétaire (plusieurs lignes → un solde total).
- Jours de retard calculés par rapport à l'échéance.
- Appel BROUILLON/ANNULE → exclu des impayés.

---

## 5. Hors périmètre

- Relances **automatiques** (planifiées) → nécessite scheduler/worker.
- Génération des courriers de mise en demeure (PDF) → slice PDF.
- Procédures judiciaires, frais de recouvrement, échéanciers → ultérieur.
- Branchement AuditLog.
