# Spec module 04 — Appels de fonds

> L'aboutissement du cœur financier : générer les **contributions par lot et par copropriétaire** à partir des tantièmes, avec numéro, statuts et relevé consolidé.
> Source : `analyse.md` domaine 9. Statut : 🟨 en revue.

---

## 1. Entités

- **AppelDeFonds** : `numero` (unique/copro), `type` (ORDINAIRE/EXCEPTIONNEL), `motif`, `dateEmission`, `dateEcheance`, `statut` (BROUILLON/VALIDE/ANNULE).
- **PosteAppel** : une clé (version) + un `montantARepartir` (entier) sur son périmètre.
- **LigneAppelDeFonds** : part d'un **redevable** pour un **lot** et un **poste**. Fige `tantiemeSnapshot`/`totalSnapshot`. `montant` entier.

---

## 2. Algorithme de génération

Pour chaque poste `{ cleId, libelle, montantARepartir }` :

1. **RG-22** : on prend la **version de clé applicable à `dateEmission`** (dans la copropriété).
2. Répartition **niveau 1** : `montantARepartir` → part de chaque **lot**, au prorata des tantièmes (méthode du plus fort reste, somme exacte).
3. Pour chaque lot, on détermine les **redevables à `dateEcheance`** (date d'exigibilité) :
   - s'il existe un **usufruitier** → c'est lui le redevable (RG-16) ;
   - sinon les détenteurs en **pleine propriété / indivision**, chacun selon sa quote-part.
4. Répartition **niveau 2** : la part du lot → part de chaque **redevable**, au prorata des quote-parts (exact).
5. Une **ligne** est créée par (lot, redevable) ; les tantièmes sont **figés**.

**Invariant** : Σ des lignes d'un poste = `montantARepartir`, exactement (aucun franc perdu).

---

## 3. Règles de gestion

1. **RG-24** `dateEcheance ≥ dateEmission`. Sinon → 400.
2. **RG-25** Chaque poste doit avoir une **version de clé applicable** non vide. Sinon → 400.
3. **RG-26** Tout lot chargé doit avoir un **redevable** à l'échéance ; sinon → 400 (liste des lots).
4. **RG-27** `numero` unique par copropriété, format `AF-<année>-<NNNN>`.
5. **RG-28** Un appel **validé** n'est plus modifiable (BROUILLON → VALIDE → verrou). Une **annulation** est possible (BROUILLON/VALIDE → ANNULE), un appel déjà annulé ne se re-traite pas.
6. **RG-29** Montants **entiers** partout.

---

## 4. Endpoints

| Méthode | Route | Action |
|---|---|---|
| POST | `/coproprietes/:coproprieteId/appels` | générer un appel (calcule les lignes) |
| GET | `/coproprietes/:coproprieteId/appels` | lister |
| GET | `/appels/:id` | détail (postes + lignes) |
| GET | `/appels/:id/releve/:personneId` | **relevé consolidé** d'un copropriétaire (détail par lot + total) |
| PATCH | `/appels/:id/valider` | BROUILLON → VALIDE |
| PATCH | `/appels/:id/annuler` | → ANNULE |

---

## 5. Cas à couvrir (tests)

- Un lot, un propriétaire plein → tout lui revient.
- Deux lots 50/50 → montant réparti par tantièmes.
- Indivision 1/2 + 1/2 → part du lot partagée (2 lignes).
- 100 sur 3 lots 1/1/1 → 34+33+33 (somme exacte).
- Indivision 1/3 + 2/3 → 300/600 sur 900.
- Lot sans redevable → 400.
- Valider puis re-valider → 409.

---

## 6. Hors périmètre (slices suivantes)

- **Génération PDF** (relevé imprimable) → nécessite une lib PDF + worker asynchrone : slice dédiée.
- Encaissements / affectation des paiements → module 05.
- Recompute à la validation, avoirs/régularisations → ultérieur.
- Branchement **AuditLog** sur la validation/annulation.
