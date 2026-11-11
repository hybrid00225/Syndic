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

**Prochaine étape :**
- Initialiser le monorepo (NestJS + Prisma + PostgreSQL + packages partagés).
- Puis implémenter **uniquement le 1er module : Patrimoine** (Copropriété → Bâtiment → Niveau → Lot), cycle complet Spec → Données → Code → Tests → Revue.
