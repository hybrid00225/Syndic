# Spec module 02 — Propriété & Copropriétaires

> Les **personnes** (copropriétaires) et la relation **M:N** entre personnes et lots (`DetentionPropriete`).
> Source : `analyse.md` domaines 3 (copropriétaires) et la règle fondamentale « jamais de lien 1:1 ».
> Statut : 🟨 en revue. **Pièce critique n°1 du projet.**

---

## 1. Entités

### Personne (copropriétaire)
Vit au niveau du **syndic** (peut posséder des lots dans plusieurs copropriétés du même syndic).

| Champ | Type | Règle |
|---|---|---|
| `type` | enum | `PHYSIQUE` ou `MORALE` |
| `nom` | string | requis (nom de famille ou raison sociale) |
| `prenom` | string? | personnes physiques |
| `actif` | bool | défaut true |
| `syndicId` | uuid | ⚠️ temporaire en body (futur : token Auth) |

### Contact (coordonnées multiples, typées)
`type` (EMAIL / TELEPHONE / ADRESSE_POSTALE), `valeur`, `libelle?`, `principal` (défaut false).

### DetentionPropriete (le cœur M:N)
| Champ | Type | Règle |
|---|---|---|
| `lotId` | uuid | lot concerné |
| `personneId` | uuid | détenteur |
| `quotePartNum` / `quotePartDen` | int | **fraction exacte**, den > 0, 0 < num/den ≤ 1 |
| `natureDroit` | enum | PLEINE_PROPRIETE, USUFRUIT, NUE_PROPRIETE, INDIVISION |
| `dateDebut` | date | requis |
| `dateFin` | date? | null = en cours |

---

## 2. Règles de gestion

1. **RG-10** Une détention relie une personne et un lot **du même syndic** (isolation). Sinon → 400.
2. **RG-11** Quote-part valide : `den > 0` et `0 < num/den ≤ 1`. Sinon → 400.
3. **RG-12** `dateFin`, si fournie, doit être strictement après `dateDebut`. Sinon → 400.
4. **RG-13** **Invariant de somme** : pour un lot, la somme des quote-parts des détentions **de même nature de droit** qui **se chevauchent dans le temps** ne doit **jamais dépasser 1**. Sinon → 409.
   - Calcul en **arithmétique entière exacte** (num/den), jamais en décimal.
   - Natures distinctes indépendantes : un usufruitier (1/1) et un nu-propriétaire (1/1) coexistent sur le même lot.
5. **RG-14** **Historique conservé** : on ne supprime pas une détention clôturée. Un transfert = clôturer l'ancienne (`dateFin`) + créer la nouvelle (le module Mutations orchestrera ; ici on autorise la clôture).
6. **RG-15** Un contact de type EMAIL doit être un email valide. Sinon → 400.
7. **RG-16** Le redevable des charges est l'**usufruitier** quand il existe (appliqué plus tard par le module Appels de fonds ; noté ici).

---

## 3. Endpoints

**Copropriétaires**
| Méthode | Route | Action |
|---|---|---|
| POST | `/personnes` | créer une personne (+ contacts optionnels) |
| GET | `/personnes?syndicId=` | lister |
| GET | `/personnes/:id` | détail (contacts + détentions) |
| PATCH | `/personnes/:id` | modifier |
| POST | `/personnes/:id/contacts` | ajouter un contact |

**Propriété**
| Méthode | Route | Action |
|---|---|---|
| POST | `/lots/:lotId/detentions` | attribuer une quote-part à une personne |
| GET | `/lots/:lotId/detentions?actives=true` | détenteurs d'un lot |
| GET | `/personnes/:id/detentions` | lots détenus par une personne |
| PATCH | `/detentions/:id` | clôturer (dateFin) / corriger |

---

## 4. Cas particuliers à couvrir (tests)

- Personne et lot de **syndics différents** → 400 (RG-10).
- Quote-part `3/2` ou `den = 0` → 400 (RG-11).
- `dateFin` ≤ `dateDebut` → 400 (RG-12).
- Deux détentions pleine propriété **60 % + 60 %** qui se chevauchent → 409 (RG-13).
- Indivision **1/2 + 1/2** sur la même période → OK (somme = 1).
- Usufruit **1/1** + Nue-propriété **1/1** sur le même lot/période → OK (natures distinctes).
- Pleine propriété **1/1** du 01/01 au 30/06, puis **1/1** à partir du 01/07 → OK (pas de chevauchement).
- Contact EMAIL invalide → 400 (RG-15).

---

## 5. Hors périmètre

- Tantièmes / clés de répartition → module 03.
- Orchestration complète des mutations (vente avec arrêt de compte) → module Mutations.
- Occupants / locataires → module ultérieur.
- Dérivation `syndicId` depuis l'Auth.
