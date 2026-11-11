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

**Prochaine étape :**
- Implémenter **uniquement le 1er module : Patrimoine** (Copropriété → Bâtiment → Niveau → Lot) : spec dans `docs/specs/01-patrimoine.md`, puis API CRUD + validation + tests. Cycle Spec → Code → Tests → Revue.
