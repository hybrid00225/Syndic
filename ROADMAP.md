# Roadmap — Syndic Alpha

> Feuille de route vivante, relue à chaque session. On avance **par vagues, un module à la fois**.
> Cycle par module : **Spec → Données → Code → Tests → Revue**.
> Légende : ⬜ à faire · 🟨 en cours · ✅ terminé

Dernière mise à jour : 2026-11-11.

---

## Vague 0 — Socle (fondations)

| Statut | Étape |
|---|---|
| ✅ | Initialiser le dépôt git |
| ✅ | Concevoir le modèle de données du cœur (`docs/data-model.md`) — gelé |
| ✅ | Mettre en place le monorepo (`apps/api` NestJS + npm workspaces) |
| ✅ | PostgreSQL (Docker, port 5435) + Prisma + 1re migration (socle + patrimoine) |
| ✅ | Auth (JWT + bcrypt) + RBAC (rôles/copro + admin syndic) — `syndicId` dérivé du token |
| 🟨 | Isolation multi-tenant : TenantGuard sur `:coproprieteId` ✅ · _RLS PostgreSQL + isolation par id d'entité = à compléter_ |
| ✅ | Journal d'audit *append-only* (intercepteur global, auteur/entité/action/après) |
| ⬜ | Design System de base (tokens, Tailwind, 1er composants) — qualité Dribbble/Pinterest |

> Web (Next.js) et packages partagés : ajoutés plus tard, quand on attaquera le front d'un module.

## Vague 1 — Cœur patrimonial (MVP, partie 1)

| Statut | Étape |
|---|---|
| ✅ | Module **Copropriétés / Bâtiments / Niveaux / Lots** (API backend + tests) — spec `docs/specs/01-patrimoine.md` |
| ✅ | Module **Copropriétaires** (personnes physiques/morales + contacts) — spec `docs/specs/02-propriete.md` |
| ✅ | **Détention de propriété M:N** (quote-part exacte, nature de droit, dates, invariant somme ≤ 100 %) — pièce critique |
| ⬜ | Module **Occupants / Locataires** |

## Vague 2 — Cœur financier (MVP, partie 2)

| Statut | Étape |
|---|---|
| ✅ | **Clés de répartition & tantièmes** (versionnés par période) — spec `docs/specs/03-tantiemes.md` |
| ⬜ | **Budgets prévisionnels** |
| ✅ | **Appels de fonds** (génération, calcul par lot/redevable, relevé consolidé) — spec `docs/specs/04-appels.md` · _PDF = slice à venir_ |
| ✅ | **Encaissements & paiements** (Mobile Money + idempotence, affectation séparée, avance) — spec `docs/specs/05-encaissements.md` |
| ✅ | **Impayés & recouvrement** (solde calculé, jours de retard, relances) — spec `docs/specs/06-impayes.md` |

## Vague 3 — Comptabilité & clôtures

| Statut | Étape |
|---|---|
| ⬜ | **Comptabilité OHADA** (partie double, journaux, grand livre, balance) |
| ⬜ | **Trésorerie & banques** (rapprochement) |
| ⬜ | **Factures fournisseurs & dépenses** |
| ⬜ | **Exercices, clôtures & régularisations** |

## Vagues suivantes (à ordonner plus tard)

- Assemblées générales & votes · Conseil syndical
- GMAO / maintenance & interventions · Équipements
- Sinistres & assurances
- Communications & notifications · Gestion documentaire
- Demandes / réclamations / incidents
- Mutations & changements de propriété
- Revenus locatifs
- **Couche plateforme SaaS** : CRM commercial, offres & abonnements, administration
- **App mobile Expo** (déployée en parallèle une fois le cœur web stable)

---

## Décisions prises

- Stack : **TypeScript** — NestJS (back) + Next.js (web) + Expo/React Native (mobile).
- Architecture : monolithe modulaire event-driven. Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- Design : qualité Dribbble/Pinterest, Design System dès le départ.

## Questions ouvertes

- Choix ORM définitif : Prisma vs TypeORM.
- Périmètre exact du MVP (où s'arrête la 1re version livrable ?).
- Fournisseurs Mobile Money / SMS / hébergement.
