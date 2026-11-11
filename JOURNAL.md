# Journal de bord — Syndic Alpha

> Une entrée par session. En fin de session : « fait / décisions / prochaine étape ».
> En début de session suivante : relire la dernière entrée. Entrées les plus récentes **en haut**.

---

## 2026-11-11 — Session 1 : cadrage & socle

**Fait :**
- Lecture et synthèse de `analyse.md` (référentiel fonctionnel : 27 domaines, 300+ règles).
- Choix de l'architecture → `ARCHITECTURE.md` (monolithe modulaire event-driven, stack TypeScript : NestJS + Next.js + Expo).
- Ajout de la contrainte design « qualité Dribbble/Pinterest » (web + mobile) à l'architecture.
- Mise en place du socle de pilotage : `git init`, `ROADMAP.md`, `docs/specs/`, `.gitignore`.
- Système de suivi à 3 niveaux défini (Roadmap / MVP+specs / Journal).
- **Cadrage du MVP** → `docs/MVP.md` : cœur = Patrimoine + Appels de fonds + Encaissements/Impayés. Hors-scope explicitement listé. 8 règles d'acceptation définies.

**Décisions :**
- Stack : TypeScript (NestJS back, Next.js web, Expo mobile).
- Méthode : par vagues, cycle Spec → Données → Code → Tests → Revue.
- MVP validé par l'utilisateur (cœur patrimoine + financier léger, sans compta OHADA complète ni AG/GMAO).

**Modèle de données :**
- `docs/data-model.md` créé puis **gelé** (schéma Prisma, 20 tables).
- Arbitrages métier validés par l'utilisateur : quote-part en **numérateur/dénominateur** (fraction exacte), **argent en entiers `BigInt`** (jamais de virgule — on ne paie pas une fraction de franc), **usufruitier = redevable**, **tables de contacts** typées, table `Relance` ajoutée.

**Autres décisions :**
- Projet renommé **ZenAPI → Syndic Alpha** (dans tous nos docs ; `analyse.md` garde l'ancien nom car c'est la source ChatGPT).
- Rappel méthode : **un module à la fois**, ne pas tout construire d'un coup.

**Init technique (fait en fin de session 1) :**
- Monorepo npm workspaces : `apps/api` (NestJS 10 + Prisma 5, compatibles Node 18).
- `docker-compose.yml` : PostgreSQL 16 sur le port hôte **5435** (5432/5433/5434 déjà pris — voir ci-dessous).
- 1re migration Prisma `init_socle_patrimoine` appliquée (tables socle + patrimoine uniquement).
- API démarre, `/health` répond `{status:ok, db:up}`. ✅
- **Contexte découvert** : une stack **zenapi-v2** (microservices Prodestic) tourne déjà en local sur cette machine — ZenAPI est le système *existant*, Syndic Alpha est le *nouveau* projet distinct.

**Commandes utiles :**
- Démarrer la DB : `npm run db:up` · logs : `npm run db:logs`
- Lancer l'API en dev : `npm run api:dev`
- Nouvelle migration : `npm run api:migrate`

**Module 01 — Patrimoine (fait, session 1) :**
- Spec `docs/specs/01-patrimoine.md` (9 règles de gestion RG-01→RG-09).
- API NestJS : Copropriété / Bâtiment / Niveau / Lot (controllers + services + DTO validés class-validator).
- Contrôles métier : RG-03 (référence lot unique → 409), RG-04 (bâtiment d'une autre copro → 400), RG-05 (cohérence niveau/bâtiment → 400), RG-06 (superficie ≥ 0), RG-07 (statut initial EN_CREATION).
- **Ajout schéma** : champ `pays` sur `Copropriete` (migration `add_pays_copropriete`) — chaque copro porte son pays (règles juridiques par pays).
- Tests : **8/8 verts** (unitaires services). Test E2E HTTP OK (copro → lot → doublon 409).
- ⏳ Reste branché plus tard : AuditLog sur écritures (RG-09), dérivation `syndicId` depuis l'Auth (actuellement en body, TEMPORAIRE).

**Module 02 — Propriété & Copropriétaires (fait, session 1) :**
- Spec `docs/specs/02-propriete.md` (RG-10 → RG-16).
- Schéma étendu : `Personne`, `Contact` (typés), `DetentionPropriete` (M:N) + enums (migration `add_personne_contact_detention`).
- Utilitaire `src/common/fraction.ts` : arithmétique de fractions **exacte** (BigInt), validation quote-part, chevauchement d'intervalles.
- API : Personne (+ contacts), Détention (attribution/clôture).
- **Invariant clé RG-13** : somme des quote-parts de même nature de droit qui se chevauchent ≤ 100 % (sinon 409). Natures distinctes (usufruit/nue-propriété) indépendantes. Usufruitier = redevable (noté, appliqué plus tard).
- Autres contrôles : RG-10 (personne+lot même syndic → 400), RG-11 (quote-part valide), RG-12 (dateFin > dateDebut), RG-15 (email valide).
- Tests : **27/27 verts** (12 fraction, 7 détention, 8 patrimoine). Smoke test HTTP OK : 3/5 + 3/5 → 409, 3/5 + 2/5 = 1 → OK, lot à 2 copropriétaires.

**Prochaine étape (à décider) :**
- Module **03 — Clés de répartition & tantièmes** (versionnés) ; ou le **front** (Design System + écrans Patrimoine/Copropriétaires).
