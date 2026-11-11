# Spec module 03 — Clés de répartition & tantièmes

> Les **clés de répartition** (catégories de charges) et les **tantièmes** par lot, **versionnés par période**.
> Source : `analyse.md` domaine 5. Base du calcul des appels de fonds (module 04).
> Statut : 🟨 en revue.

---

## 1. Entités

### CleRepartition
`nom` (ex. « Charges générales », « Ascenseur A »), `description?`, appartient à une copropriété.

### CleRepartitionVersion
Une version d'une clé, valable sur une période.
| Champ | Règle |
|---|---|
| `dateEffet` | début de validité |
| `dateFin` | null = version courante |
| `totalTantiemes` | **somme figée** des tantièmes de la version (calculée, non saisie) |

### Tantieme
`valeur` (int ≥ 0) par `(version, lot)`. Unique sur `(versionId, lotId)`.

---

## 2. Règles de gestion

1. **RG-17** Une clé appartient à une copropriété existante.
2. **RG-18** Tous les lots d'une version appartiennent à la **copropriété de la clé** (isolation). Sinon → 400.
3. **RG-19** Chaque tantième `valeur ≥ 0` ; le total de la version doit être `> 0`. `totalTantiemes` = somme (jamais saisi à la main).
4. **RG-20** Un lot ne peut apparaître **qu'une fois** dans une version. Sinon → 400.
5. **RG-21** **Versioning** : la `dateEffet` d'une nouvelle version doit être strictement postérieure à celle de la version courante. Créer une version **clôture** automatiquement la précédente (`dateFin` = `dateEffet` de la nouvelle). Pas de chevauchement.
6. **RG-22** La version applicable à une date D est celle où `dateEffet ≤ D < dateFin` (ou `dateFin` null).
7. **RG-23** **Immuabilité** : on ne modifie pas les tantièmes d'une version existante → on crée une nouvelle version. Les exercices passés ne sont jamais recalculés silencieusement (règle 5.14).

---

## 3. Répartition (utilitaire monétaire)

Formule : `part_lot = valeur_lot / total_tantièmes × montant`.

⚠️ **Montants entiers** (pas de virgule) → on utilise la **méthode du plus fort reste** pour que la somme des parts soit **exactement** égale au montant réparti (aucun franc perdu ni créé). Implémenté dans `src/common/repartition.ts`, en `BigInt`.

Exemple : répartir 100 FCFA sur tantièmes 1/1/1 → 34 + 33 + 33 = 100 (et non 33,33 chacun).

---

## 4. Endpoints

| Méthode | Route | Action |
|---|---|---|
| POST | `/coproprietes/:coproprieteId/cles` | créer une clé |
| GET | `/coproprietes/:coproprieteId/cles` | lister les clés |
| GET | `/cles/:id` | détail (avec versions) |
| PATCH | `/cles/:id` | renommer / décrire |
| POST | `/cles/:cleId/versions` | créer une version `{ dateEffet, tantiemes:[{lotId,valeur}] }` |
| GET | `/cles/:cleId/versions` | historique des versions |
| GET | `/cles/:cleId/versions/applicable?date=YYYY-MM-DD` | version applicable à une date |

---

## 5. Cas particuliers à couvrir (tests)

- Version avec un lot d'**une autre copropriété** → 400 (RG-18).
- Même `lotId` deux fois dans la version → 400 (RG-20).
- Total des tantièmes = 0 → 400 (RG-19).
- Nouvelle version avec `dateEffet` ≤ version courante → 400 (RG-21).
- Création d'une 2ᵉ version → la 1ʳᵉ est **clôturée** (`dateFin` renseignée).
- Version applicable à une date → renvoie la bonne version (RG-22).
- Répartition 100 sur 1/1/1 → 34+33+33 = 100 (plus fort reste).

---

## 6. Hors périmètre

- Appels de fonds (utilisation réelle des tantièmes) → module 04.
- Périmètres de clé partiels (certains bâtiments/équipements) : modélisables via les lots inclus dans la version ; affinage ultérieur.
