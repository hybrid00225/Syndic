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

**Module 03 — Clés de répartition & tantièmes (fait, session 1) :**
- Spec `docs/specs/03-tantiemes.md` (RG-17 → RG-23).
- Schéma : `CleRepartition`, `CleRepartitionVersion` (versionnée), `Tantieme` (migration `add_cle_version_tantieme`).
- Utilitaire `src/common/repartition.ts` : répartition d'un montant **entier** par tantièmes, **méthode du plus fort reste** → somme exacte (ex. 100 sur 1/1/1 = 34+33+33).
- API : clés (CRUD) + versions (création avec tantièmes, historique, « version applicable à une date »).
- Logique de **versioning** : créer une nouvelle version clôture la précédente (`dateFin`), pas de chevauchement ; total figé = somme (RG-19) ; isolation copropriété (RG-18) ; unicité lot (RG-20).
- Tests : **38/38 verts** (+5 répartition, +6 version). Smoke test HTTP OK (v2 clôture v1, applicable?date renvoie la bonne version).

**Module 04 — Appels de fonds (fait, session 1) :**
- Spec `docs/specs/04-appels.md` (RG-24 → RG-29).
- Schéma : `AppelDeFonds`, `PosteAppel`, `LigneAppelDeFonds` + enums (migration `add_appel_de_fonds`).
- Calcul PUR `src/appels/appel-calcul.ts` : **double répartition** (montant → lots par tantièmes, puis part du lot → redevables par quote-parts), somme exacte. Helper `fractionsToWeights` (fractions → poids entiers via PPCM).
- Service : version de clé applicable à `dateEmission`, redevables à `dateEcheance` (usufruitier prioritaire), génération en transaction, numéro `AF-<année>-<NNNN>`, statuts BROUILLON/VALIDE/ANNULE, relevé consolidé par copropriétaire.
- **BigInt sérialisé en string** dans les réponses JSON (main.ts).
- Tests : **47/47 verts** (+10 calcul). Smoke test E2E complet : 1 000 000 réparti 500k/150k/150k/200k (indivision incluse), relevé Koné = 700k, valider→409 au re-valider.

**Module 05 — Encaissements & paiements (fait, session 1) :**
- Spec `docs/specs/05-encaissements.md` (RG-30 → RG-37).
- Schéma : `Paiement`, `AffectationPaiement` + enums (migration `add_paiement_affectation`).
- Règle d'or **paiement ≠ affectation** : on enregistre un paiement, on l'affecte séparément à une/des ligne(s).
- **Idempotence Mobile Money** : `idempotencyKey @unique` → re-notification renvoie le paiement existant (anti double-comptage), robuste aux courses (catch P2002).
- Invariants : RG-34 (Σ affectations ≤ montant paiement, reste = avance), RG-35 (Σ affectations ≤ dû de la ligne), RG-36 (isolation copro), RG-37 (seul VALIDE affectable ; annuler retire les affectations).
- Tests : **54/54 verts** (+7). Smoke E2E : idempotence (même id), 400 sur sur-affectation paiement et sur dette, avance de 20 000 conservée.

**Le cycle financier complet du MVP tourne** : patrimoine → propriété → tantièmes → appels de fonds → encaissements/affectation.

**Module 06 — Impayés & recouvrement (fait, session 1) :**
- Spec `docs/specs/06-impayes.md` (RG-38 → RG-42).
- Pas de table « dette » : le solde se **calcule** (montant ligne − Σ affectations). Nouvelle table `Relance` (migration `add_relance`).
- Calcul pur `src/recouvrement/recouvrement-calcul.ts` : impayés groupés par copropriétaire, jours de retard, tri par solde.
- Service : impayés (appels VALIDE seulement), situation (dû/payé/solde/avances), relances (fige le montant réclamé).
- Tests : **60/60 verts** (+6). Smoke E2E : solde 70k, 224 jours retard, relance, puis 0 impayé après règlement.

**🎯 BACKEND DU MVP COMPLET** — tout le cycle métier tourne et est testé E2E : patrimoine → propriété → tantièmes → appels de fonds → encaissements → impayés/recouvrement. 6 modules, 60 tests, 7 migrations. DoD du MVP cochée côté backend (voir `docs/MVP.md`).

**Couche Auth + RBAC (fait, session 1) :**
- Deps : `@nestjs/jwt`, `bcryptjs`. Champ `User.adminSyndic` (migration `add_user_admin_syndic`). Env `JWT_SECRET`/`JWT_EXPIRES_IN`.
- Module `src/auth` : register (crée syndic + admin), login, /auth/me. Hash bcrypt, JWT 7j.
- 3 gardes globales (APP_GUARD, ordre JWT → Tenant → Roles) : `JwtAuthGuard` (+ `@Public`), `TenantGuard` (isolation sur `:coproprieteId`), `RolesGuard` (`@Roles`, admin bypass). Décorateur `@CurrentUser`.
- Gestion utilisateurs : POST/GET `/users` (admin) avec rôles par copropriété.
- **Refactor clé** : `syndicId` retiré des DTO (copropriété, personne) → dérivé du token. `@Roles(GESTIONNAIRE)` sur appel create, `@Roles(CAISSIER,COMPTABLE)` sur paiement create (démo RBAC).
- Tests : **63/63 verts** (+3 auth). Smoke E2E : 401 sans token, copro créée sans syndicId, comptable→403 sur appel, isolation syndic B→403, mauvais mdp→401.

**Reste sur la sécurité (pas fait) :** RLS PostgreSQL + isolation sur les routes keyées par id d'entité (lot/:id, appel/:id, paiement/:id ne sont pas encore vérifiés vs le syndic de l'utilisateur). AuditLog pas encore branché.

**Prochaine étape :**
- **AuditLog** (traçabilité append-only) ; ou **slice PDF** ; ou le **front** (Design System).
