# Spec module 01 — Patrimoine

> Gestion de la structure physique : **Copropriété → Bâtiment → Niveau → Lot**.
> Source : `analyse.md` domaines 1 (copropriétés) et 2 (bâtiments, niveaux, lots).
> Statut : 🟨 en revue. Périmètre MVP (sans propriété/tantièmes, qui sont des modules séparés).

---

## 1. Entités & champs

### Copropriété
| Champ | Type | Règle |
|---|---|---|
| `nom` | string | requis |
| `pays` | string (ISO) | requis (pilote les règles juridiques) |
| `devise` | string | défaut `XOF` |
| `adresse` | string? | optionnel |
| `statut` | enum | `EN_CREATION` → `ACTIVE` → `INACTIVE`/`CLOTUREE` |
| `syndicId` | uuid | rattachement (⚠️ temporaire en body tant que l'Auth n'existe pas) |

### Bâtiment
`nom` (requis), appartient à une copropriété.

### Niveau
`nom` (requis), `ordre` (int, défaut 0), appartient à un bâtiment.

### Lot
| Champ | Type | Règle |
|---|---|---|
| `reference` | string | requis, **unique dans la copropriété** |
| `type` | enum | requis (APPARTEMENT, PARKING, CAVE, MAGASIN, BUREAU, ENTREPOT, AUTRE) |
| `designation` | string? | optionnel |
| `superficie` | decimal? | m² (≥ 0) — surface, **pas** de l'argent |
| `statut` | enum | défaut `VACANT` |
| `batimentId` | uuid? | optionnel (ex. parking hors bâtiment) |
| `niveauId` | uuid? | optionnel |

---

## 2. Règles de gestion (contrôles à implémenter)

1. **RG-01** Un bâtiment doit appartenir à une copropriété existante.
2. **RG-02** Un niveau doit appartenir à un bâtiment existant.
3. **RG-03** La `reference` d'un lot est **unique dans sa copropriété** (deux copropriétés peuvent avoir chacune un lot « A101 »).
4. **RG-04** Si un lot précise un `batimentId`, ce bâtiment doit appartenir à **la même copropriété**.
5. **RG-05** Si un lot précise un `niveauId`, ce niveau doit appartenir au `batimentId` fourni (le `batimentId` devient alors requis).
6. **RG-06** `superficie` ≥ 0 si fournie.
7. **RG-07** Création d'une copropriété → statut initial `EN_CREATION`.
8. **RG-08** On ne supprime pas physiquement une copropriété active : passage en `INACTIVE`/`CLOTUREE` (soft). (Suppression dure réservée aux brouillons `EN_CREATION`.)
9. **RG-09** Toute écriture (create/update) sur ces entités journalise un `AuditLog` (branché quand le module Audit sera prêt — TODO tracé).

---

## 3. Endpoints (API REST)

| Méthode | Route | Action |
|---|---|---|
| POST | `/coproprietes` | créer une copropriété |
| GET | `/coproprietes?syndicId=` | lister |
| GET | `/coproprietes/:id` | détail (avec bâtiments) |
| PATCH | `/coproprietes/:id` | modifier (nom, adresse, statut…) |
| POST | `/coproprietes/:coproprieteId/batiments` | créer un bâtiment |
| GET | `/coproprietes/:coproprieteId/batiments` | lister les bâtiments |
| PATCH | `/batiments/:id` | modifier |
| POST | `/batiments/:batimentId/niveaux` | créer un niveau |
| GET | `/batiments/:batimentId/niveaux` | lister les niveaux |
| PATCH | `/niveaux/:id` | modifier |
| POST | `/coproprietes/:coproprieteId/lots` | créer un lot |
| GET | `/coproprietes/:coproprieteId/lots?type=&statut=` | lister les lots |
| GET | `/lots/:id` | détail |
| PATCH | `/lots/:id` | modifier |

Codes d'erreur : `404` (entité absente), `409` (référence de lot en doublon), `400` (incohérence bâtiment/niveau/copropriété, superficie < 0).

---

## 4. Cas particuliers à couvrir (tests)

- Deux copropriétés différentes avec chacune un lot `A101` → **OK** (pas de conflit).
- Deux lots `A101` dans la **même** copropriété → **409**.
- Lot rattaché à un bâtiment d'**une autre** copropriété → **400** (RG-04).
- Lot avec `niveauId` mais sans `batimentId` → **400** (RG-05).
- Lot avec `niveauId` d'un **autre** bâtiment que `batimentId` → **400** (RG-05).
- Superficie négative → **400** (RG-06).
- Création de copropriété → statut `EN_CREATION` (RG-07).

---

## 5. Hors périmètre de ce module

- Propriété (qui possède le lot) → module **02 Propriété** (`DetentionPropriete`).
- Tantièmes/clés → module **03**.
- Auth / dérivation du `syndicId` depuis le token → module **Auth** (en attendant : `syndicId` en body/param, marqué TEMPORAIRE).
- Fusion/subdivision de lots, annexes, équipements → vagues ultérieures.
