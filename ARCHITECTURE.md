# Architecture — ZenAPI (SaaS de gestion de syndic)

> Document de référence technique. Dernière mise à jour : 2026-11-11.
> Cible : Afrique de l'Ouest (FCFA, Mobile Money, cadre OHADA), règles juridiques **paramétrables par pays**.
> Voir le référentiel fonctionnel complet dans [`analyse.md`](./analyse.md) (27 domaines, 300+ règles de gestion).

---

## 1. Principe directeur

**Monolithe modulaire *event-driven*** — PAS de micro-services au démarrage.

Une seule application backend, découpée en **modules étanches qui correspondent aux 27 domaines métier** du référentiel. Chaque frontière de module = une future frontière de service, le jour où un domaine devra scaler seul.

> On a la **simplicité du monolithe** aujourd'hui et le **chemin vers la scalabilité** demain, sans payer la complexité des micro-services avant d'en avoir besoin.

Les modules **ne s'appellent pas directement** : ils communiquent par **événements de domaine** (ex. `PaiementValidé` → la compta écrit l'écriture, la dette se met à jour, la notif part, le reçu PDF se génère). Découplage, traçabilité (audit), et asynchronisme natif.

---

## 2. Stack technique

| Couche | Techno | Rôle |
|---|---|---|
| Frontend web | **Next.js** (React, TypeScript) + PWA | UI web, portail copropriétaire |
| App mobile | **Expo (React Native)** + NativeWind | App native iOS/Android, **mode hors-ligne** |
| Design System | **Tailwind / NativeWind** + shadcn/ui (personnalisé) + Framer Motion | Identité visuelle partagée web+mobile, qualité « Dribbble/Pinterest » |
| Backend | **NestJS** (TypeScript), monolithe modulaire | Cœur applicatif, API, logique métier |
| Base de données | **PostgreSQL** + Row-Level Security | Données transactionnelles, isolation multi-tenant |
| ORM | **Prisma** (ou TypeORM) | Accès typé à la base |
| Cache / Bus | **Redis** | Cache, sessions, pub/sub temps réel, backend des files |
| Files d'attente | **BullMQ** (sur Redis) | Travaux asynchrones (PDF, relances, notifications) |
| Stockage fichiers | **S3-compatible** (AWS S3 ou **MinIO** auto-hébergé) | Documents, pièces jointes, PDF générés |
| Temps réel | **Socket.io** + Redis adapter | Notifications, AG en direct, multi-utilisateurs |
| Services externes | Mobile Money, SMS, Email, WhatsApp | Intégrations **paramétrables** |

**Langage unique (TypeScript) front + back** → types partagés (un `AppelDeFonds` est typé pareil des deux côtés), moins de bugs, vélocité maximale pour une petite équipe.

---

## 3. Diagramme d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTS                                    │
│  Web (Next.js PWA) · Mobile PWA offline · Portail copro      │
└───────────────┬─────────────────────────┬───────────────────┘
                │ HTTPS/REST+tRPC          │ WebSocket (temps réel)
┌───────────────▼─────────────────────────▼───────────────────┐
│              API / BACKEND (NestJS)                          │
│   Auth · RBAC multi-copro · Rate-limit · Audit · Validation  │
├──────────────────────────────────────────────────────────────┤
│   MODULES MÉTIER (bounded contexts = les 27 domaines)        │
│   Patrimoine │ Propriété(M:N) │ Tantièmes │ Appels de fonds  │
│   Encaissements │ Compta OHADA │ AG │ GMAO │ Documents │ ... │
│         ↕ communiquent par ÉVÉNEMENTS DE DOMAINE ↕          │
└───┬──────────┬───────────┬──────────┬──────────┬────────────┘
    │          │           │          │          │
┌───▼───┐ ┌────▼────┐ ┌────▼─────┐ ┌──▼───┐ ┌────▼──────┐
│Postgre│ │ Redis   │ │ Workers  │ │ S3 / │ │ Services  │
│  SQL  │ │cache+bus│ │ (BullMQ) │ │MinIO │ │ externes  │
│ +RLS  │ │+pub/sub │ │PDF·relan.│ │fichr │ │SMS·MoMo·📧│
└───────┘ └─────────┘ └──────────┘ └──────┘ └───────────┘
```

---

## 4. Décisions d'architecture par exigence

### 4.1 🔒 Sécurité
- **PostgreSQL + Row-Level Security (RLS)** : l'isolation entre syndics/copropriétés est garantie **au niveau de la base**, pas seulement du code applicatif. Un bug applicatif ne peut pas faire fuiter les données d'une copro à l'autre (règle 1.20).
- **RBAC multi-copropriété** : un utilisateur a des rôles **différents selon la copropriété** (règle 23.3). Permissions **configurables**, jamais codées en dur.
- **Séparation des tâches** : un utilisateur ne valide pas sa propre opération (règle 23.9) — contrôlé par le moteur de permissions.
- **Journal d'audit *append-only*** : toute opération sensible tracée (auteur, valeur avant/après, horodatage). Table **immuable** — jamais d'UPDATE/DELETE (section 26).
- Auth par **sessions sécurisées + MFA**, TLS en transit, chiffrement au repos, secrets hors du code (variables d'environnement / coffre).

### 4.2 📈 Évolution & maintenabilité
- **Domain-Driven Design** : chaque domaine = module isolé avec sa propre logique. On ajoute un module sans casser les autres.
- **Architecture hexagonale sur le cœur financier** (tantièmes, compta) : logique métier isolée du framework → testable à 100 %, jamais réécrite si on change d'outil.
- **Moteur de règles paramétrable** : règles juridiques par pays (OHADA, délais de relance, majorités d'AG, seuils…) dans des **tables de configuration / JSONB**, **jamais dans le code**. Exigence structurante du référentiel.

### 4.3 ⚡ Rapidité d'exécution
- **Redis** en cache (soldes, tantièmes recalculés, sessions).
- **Travaux lourds en arrière-plan (BullMQ)** : génération de masse d'appels de fonds, PDF en lot, relances, rapprochement bancaire → jamais dans le temps de réponse HTTP. L'interface reste instantanée.
- **L'argent en `NUMERIC` / centimes entiers, JAMAIS en flottant** — règle d'or non négociable (erreurs d'arrondi interdites en compta).

### 4.4 📄 PDF, documents & fichiers
- **Stockage objet S3-compatible** (MinIO auto-hébergé envisagé pour latence/coûts en Afrique de l'Ouest). Les fichiers ne vivent **jamais** en base ; en base seulement métadonnées + versions (section 20).
- **URL signées temporaires** pour l'accès sécurisé (un copropriétaire ne voit que ses documents).
- **Génération PDF** (appels de fonds, reçus, PV d'AG, états financiers) via **worker dédié** : template HTML → PDF, asynchrone.

### 4.5 🔴 Temps réel & 👥 Multi-utilisateurs
- **WebSockets (Socket.io) + Redis pub/sub** : scaler sur plusieurs instances sans perdre les connexions.
- Cas d'usage : notifications instantanées (paiement reçu, nouvel appel de fonds), **votes d'AG en direct**, tableaux de bord auto-rafraîchis, présence « qui est connecté ».
- **Idempotence** sur les webhooks Mobile Money (clé d'idempotence) → **impossible de compter 2× une transaction** (règle 10.24).

### 4.6 🎨 Design & expérience utilisateur (contrainte produit forte)
> Exigence de l'utilisateur, hors `analyse.md` : des vues de **qualité Dribbble/Pinterest**, web ET mobile. Différenciateur clé dans un marché austère. Se construit dès la fondation, jamais « rajouté à la fin ».

- **Design System d'abord** : tokens (couleurs, typo, espacements, rayons, ombres), composants réutilisables. Garant de la cohérence visuelle.
- **Tailwind CSS** (web) + **NativeWind** (mobile) → même langage de style, une seule identité visuelle partagée.
- **shadcn/ui personnalisé** comme base de composants (fortement retravaillé pour ne pas « ressembler à tout le monde »).
- **Framer Motion** : animations et micro-interactions (transitions, feedback, états de chargement élégants) = sensation « premium ».
- **Maîtrise de la densité d'information** : un logiciel de compta affiche beaucoup de données → éviter le fouillis. Hiérarchie visuelle claire, dark mode, responsive impeccable, accessibilité.
- **Mobile = vraie app native** (Expo/React Native), pas une simple PWA, pour l'expérience et le hors-ligne.

---

## 5. Modèle de données — points critiques

> C'est ici que 90 % des logiciels de syndic se plantent. Fondations non négociables :

1. **Propriété en plusieurs-à-plusieurs** : table pivot `detention_propriete`
   (`proprietaire_id`, `lot_id`, `quote_part`, `nature_droit`, `date_debut`, `date_fin`).
   **Jamais** de lien direct 1:1 copropriétaire↔lot (section 3, règle fondamentale).
2. **Tantièmes versionnés par période** : un calcul utilise la version de la clé applicable à la période concernée (règle 5.15). Une modification ne recalcule jamais silencieusement un exercice clôturé (règle 5.14).
3. **Mutations non destructives** : une vente n'écrase ni les paiements, ni les factures, ni l'historique de propriété (section 24). On distingue période de propriété, date d'exigibilité, payeur effectif et redevable juridique.
4. **Paiement ≠ affectation** : deux opérations distinctes (section 10). Un paiement reçu n'est pas automatiquement imputé à une dette.
5. **Comptabilité en partie double**, écritures validées **jamais supprimées** → correction par contre-passation (section 13). Montants en `NUMERIC`.
6. **Multi-tenant** : `syndic_id` (tenant) + scoping copropriété sur chaque table, appliqué par RLS.

---

## 6. Communication inter-modules (événements de domaine)

Pattern **outbox** pour la fiabilité : l'événement est écrit en base dans la même transaction que la donnée métier, puis publié de façon fiable.

Exemple de chaîne sur `PaiementValidé` :
```
PaiementValidé
 ├─▶ Module Compta       → génère l'écriture comptable
 ├─▶ Module Impayés      → met à jour le solde de la dette
 ├─▶ Module Documents    → génère le reçu PDF (worker)
 └─▶ Module Communication→ notifie le copropriétaire (email/SMS)
```

---

## 7. Stratégie de scalabilité

1. **Aujourd'hui** : monolithe modulaire, une base PostgreSQL, instances backend horizontales derrière un load-balancer (état partagé via Redis).
2. **Demain** : extraire en service séparé **uniquement** le(s) module(s) sous forte charge (ex. génération PDF/reporting, notifications). Les frontières de modules sont déjà prêtes pour ça.
3. Base : réplicas de lecture pour les rapports ; partitionnement par `syndic_id` si nécessaire.

---

## 8. Déploiement & exploitation

- **Conteneurisation Docker**, orchestration simple au départ (un VPS/managed), scalable horizontalement.
- Région d'hébergement proche de l'Afrique de l'Ouest (latence) + CDN pour les assets statiques.
- **Observabilité** : logs structurés, suivi d'erreurs (Sentry), métriques.
- CI/CD avec tests automatisés — le cœur financier exige une couverture de tests élevée.

---

## 9. Ce qui reste à décider / à cadrer

- [ ] Choix définitif ORM : **Prisma** (DX, typage) vs TypeORM.
- [ ] Périmètre du **MVP** et ordre des modules (voir roadmap à venir).
- [ ] Modèle de données détaillé du cœur (patrimoine → propriété → tantièmes → appels de fonds → encaissements → compta).
- [ ] Fournisseurs concrets : Mobile Money (Wave, Orange Money…), SMS, hébergement/stockage.
- [x] Stratégie mobile : **Expo (React Native) + NativeWind** — vraie app native partageant types et design avec le web (à confirmer au moment du mobile).
- [ ] Direction artistique du Design System : palette, typo, inspiration (références Dribbble/Pinterest à rassembler).
