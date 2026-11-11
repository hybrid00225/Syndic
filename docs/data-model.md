# Modèle de données — Cœur ZenAPI (MVP)

> **La fondation la plus critique du projet.** Conçue pour être juste dès le départ sur les 3 pièges mortels : propriété M:N, tantièmes versionnés, paiement ≠ affectation.
> Schéma de référence (Prisma). Il sera copié dans `prisma/schema.prisma` à l'initialisation du monorepo.

Dernière mise à jour : 2026-11-11. Statut : **🟨 en revue — à geler avec l'utilisateur avant implémentation.**

---

## 1. Principes de modélisation (transversaux)

| Principe | Règle |
|---|---|
| **Argent** | Type `Decimal` (→ PostgreSQL `NUMERIC`), **jamais** `Float`. XOF/FCFA = 0 décimale, mais on stocke en `Decimal(18,4)` pour rester multi-devise. |
| **Identifiants** | `uuid` sur toutes les tables (distribué, non devinable). |
| **Multi-tenant** | `syndicId` en tête de hiérarchie, `coproprieteId` sur les tables métier → isolation par **RLS PostgreSQL**. |
| **Historisation** | Pas de suppression physique des données sensibles → `date_fin` / statut `ANNULE` / soft-delete. L'historique de propriété et les écritures financières sont **immuables**. |
| **Versioning** | Les tantièmes et clés sont **versionnés par période** : un calcul passé n'est jamais recalculé silencieusement. |
| **Audit** | Table `AuditLog` *append-only* : toute opération sensible (auteur, avant/après, horodatage). |
| **Snapshot de calcul** | Une ligne d'appel de fonds **fige** les tantièmes utilisés au moment du calcul (traçabilité, indépendance vis-à-vis des évolutions futures). |

---

## 2. Vue d'ensemble des relations

```
Syndic ─┬─< User >─── UserCoproprieteRole >─── Copropriete
        ├─< Personne (copropriétaires, physiques/morales)
        └─< Copropriete ─┬─< Batiment ─< Niveau ─< Lot
                         ├─< CleRepartition ─< CleRepartitionVersion ─< Tantieme >─ Lot
                         ├─< AppelDeFonds ─< PosteAppel ─< LigneAppelDeFonds >─ Lot
                         ├─< Paiement ─< AffectationPaiement >─ LigneAppelDeFonds
                         └─< Document / AuditLog

Lot >── DetentionPropriete ──< Personne     (M:N : quote-part, nature, dates)
LigneAppelDeFonds ── redevable ──> Personne  (le redevable juridique à la date)
```

---

## 3. Schéma Prisma (MVP)

```prisma
// =====================================================================
// SOCLE — multi-tenant, utilisateurs, audit
// =====================================================================

model Syndic {
  id          String   @id @default(uuid())
  nom         String
  pays        String   // code ISO, pilote les règles juridiques paramétrables
  devise      String   @default("XOF")
  createdAt   DateTime @default(now())

  users         User[]
  personnes     Personne[]
  coproprietes  Copropriete[]
}

model User {
  id           String   @id @default(uuid())
  syndicId     String
  email        String   @unique
  motDePasse   String   // hash (argon2)
  nom          String
  actif        Boolean  @default(true)
  mfaActive    Boolean  @default(false)
  createdAt    DateTime @default(now())

  syndic   Syndic @relation(fields: [syndicId], references: [id])
  roles    UserCoproprieteRole[]
}

enum RoleType {
  ADMIN_SYNDIC
  GESTIONNAIRE
  COMPTABLE
  CAISSIER
}

// RBAC : un utilisateur a un rôle DIFFÉRENT par copropriété (règle 23.3)
model UserCoproprieteRole {
  id            String   @id @default(uuid())
  userId        String
  coproprieteId String
  role          RoleType

  user        User        @relation(fields: [userId], references: [id])
  copropriete Copropriete @relation(fields: [coproprieteId], references: [id])

  @@unique([userId, coproprieteId, role])
}

// Journal d'audit append-only (aucun UPDATE/DELETE autorisé)
model AuditLog {
  id            String   @id @default(uuid())
  syndicId      String
  coproprieteId String?
  userId        String?
  entite        String   // ex. "Paiement"
  entiteId      String
  action        String   // CREATE | UPDATE | VALIDATE | CANCEL ...
  avant         Json?
  apres         Json?
  horodatage    DateTime @default(now())

  @@index([entite, entiteId])
  @@index([coproprieteId])
}

// =====================================================================
// PATRIMOINE — copropriété → bâtiment → niveau → lot
// =====================================================================

enum CoproprieteStatut { EN_CREATION ACTIVE INACTIVE CLOTUREE }

model Copropriete {
  id          String   @id @default(uuid())
  syndicId    String
  nom         String
  adresse     String?
  devise      String   @default("XOF")
  statut      CoproprieteStatut @default(EN_CREATION)
  dateCreation DateTime @default(now())

  syndic      Syndic @relation(fields: [syndicId], references: [id])
  batiments   Batiment[]
  lots        Lot[]
  cles        CleRepartition[]
  appels      AppelDeFonds[]
  paiements   Paiement[]
  roles       UserCoproprieteRole[]

  @@index([syndicId])
}

model Batiment {
  id            String @id @default(uuid())
  coproprieteId String
  nom           String  // ex. "Bâtiment A", "Bloc 1"

  copropriete Copropriete @relation(fields: [coproprieteId], references: [id])
  niveaux     Niveau[]
  lots        Lot[]
}

model Niveau {
  id         String @id @default(uuid())
  batimentId String
  nom        String // ex. "RDC", "1er étage"
  ordre      Int    @default(0)

  batiment Batiment @relation(fields: [batimentId], references: [id])
  lots     Lot[]
}

enum LotType { APPARTEMENT PARKING CAVE MAGASIN BUREAU ENTREPOT AUTRE }
enum LotStatut { OCCUPE_PROPRIETAIRE LOUE VACANT EN_TRAVAUX INDISPONIBLE VENDU }

model Lot {
  id            String   @id @default(uuid())
  coproprieteId String
  batimentId    String?
  niveauId      String?
  reference     String   // identifiant unique DANS la copropriété (ex. "A101")
  type          LotType
  designation   String?
  superficie    Decimal? @db.Decimal(10, 2)
  statut        LotStatut @default(VACANT)

  copropriete  Copropriete @relation(fields: [coproprieteId], references: [id])
  batiment     Batiment?   @relation(fields: [batimentId], references: [id])
  niveau       Niveau?     @relation(fields: [niveauId], references: [id])
  detentions   DetentionPropriete[]
  tantiemes    Tantieme[]
  lignesAppel  LigneAppelDeFonds[]

  @@unique([coproprieteId, reference])
  @@index([coproprieteId])
}

// =====================================================================
// PERSONNES & PROPRIÉTÉ  (⚠️ pièce critique n°1)
// =====================================================================

enum PersonneType { PHYSIQUE MORALE }

// Une personne vit au niveau du SYNDIC : elle peut posséder des lots
// dans plusieurs copropriétés du même syndic (règle 3.15).
model Personne {
  id        String       @id @default(uuid())
  syndicId  String
  type      PersonneType
  nom       String       // nom/raison sociale
  prenom    String?
  emails    String[]     // plusieurs adresses (règle 3.18)
  telephones String[]
  adresse   String?
  actif     Boolean      @default(true)
  createdAt DateTime     @default(now())

  syndic      Syndic @relation(fields: [syndicId], references: [id])
  detentions  DetentionPropriete[]
  lignesDues  LigneAppelDeFonds[]  @relation("Redevable")
  paiements   Paiement[]           @relation("Payeur")

  @@index([syndicId])
}

enum NatureDroit { PLEINE_PROPRIETE USUFRUIT NUE_PROPRIETE INDIVISION }

// ⚠️ LE CŒUR : relation plusieurs-à-plusieurs Personne ↔ Lot.
// JAMAIS de lien direct 1:1. Sert aussi d'HISTORIQUE des mutations.
model DetentionPropriete {
  id          String      @id @default(uuid())
  lotId       String
  personneId  String
  quotePart   Decimal     @db.Decimal(9, 6) // fraction 0..1 (ex. 0.5)
  natureDroit NatureDroit @default(PLEINE_PROPRIETE)
  dateDebut   DateTime
  dateFin     DateTime?   // null = détention en cours

  lot      Lot      @relation(fields: [lotId], references: [id])
  personne Personne @relation(fields: [personneId], references: [id])

  @@index([lotId, dateDebut])
  @@index([personneId])
  // Invariant applicatif : Σ quotePart (pleine propriété) par lot / période = 1
}

// =====================================================================
// CLÉS DE RÉPARTITION & TANTIÈMES  (⚠️ pièce critique n°2 : versioning)
// =====================================================================

model CleRepartition {
  id            String @id @default(uuid())
  coproprieteId String
  nom           String // ex. "Charges générales", "Ascenseur A"
  description   String?

  copropriete Copropriete @relation(fields: [coproprieteId], references: [id])
  versions    CleRepartitionVersion[]

  @@index([coproprieteId])
}

// Une clé est VERSIONNÉE : chaque version vaut à partir d'une date d'effet.
// Un calcul utilise la version applicable à la période (règle 5.15).
model CleRepartitionVersion {
  id             String   @id @default(uuid())
  cleId          String
  dateEffet      DateTime
  dateFin        DateTime? // null = version courante
  totalTantiemes Int       // somme figée des tantièmes de cette version

  cle       CleRepartition @relation(fields: [cleId], references: [id])
  tantiemes Tantieme[]
  postes    PosteAppel[]

  @@index([cleId, dateEffet])
}

model Tantieme {
  id        String @id @default(uuid())
  versionId String
  lotId     String
  valeur    Int    // tantièmes du lot dans cette version de la clé

  version CleRepartitionVersion @relation(fields: [versionId], references: [id])
  lot     Lot                   @relation(fields: [lotId], references: [id])

  @@unique([versionId, lotId])
}

// =====================================================================
// APPELS DE FONDS  (génération + calcul par lot)
// =====================================================================

enum AppelType   { ORDINAIRE EXCEPTIONNEL }
enum AppelStatut { BROUILLON VALIDE ANNULE }

model AppelDeFonds {
  id            String      @id @default(uuid())
  coproprieteId String
  numero        String      // unique dans la copropriété
  type          AppelType   @default(ORDINAIRE)
  motif         String
  dateEmission  DateTime    @default(now())
  dateEcheance  DateTime
  statut        AppelStatut @default(BROUILLON)

  copropriete Copropriete @relation(fields: [coproprieteId], references: [id])
  postes      PosteAppel[]
  lignes      LigneAppelDeFonds[]

  @@unique([coproprieteId, numero])
  @@index([coproprieteId])
}

// Un poste = une clé + un montant à répartir sur son périmètre.
model PosteAppel {
  id              String  @id @default(uuid())
  appelId         String
  cleVersionId    String
  libelle         String
  montantARepartir Decimal @db.Decimal(18, 4)

  appel      AppelDeFonds          @relation(fields: [appelId], references: [id])
  cleVersion CleRepartitionVersion @relation(fields: [cleVersionId], references: [id])
  lignes     LigneAppelDeFonds[]
}

// Une ligne = la part d'un lot pour un poste. FIGE les tantièmes utilisés.
// Montant = tantiemeLot / totalTantiemes * montantARepartir.
model LigneAppelDeFonds {
  id              String  @id @default(uuid())
  appelId         String
  posteId         String
  lotId           String
  redevableId     String  // personne juridiquement redevable à la date d'exigibilité
  tantiemeSnapshot Int    // tantièmes figés au calcul
  totalSnapshot    Int    // total figé au calcul
  montant          Decimal @db.Decimal(18, 4)

  appel     AppelDeFonds @relation(fields: [appelId], references: [id])
  poste     PosteAppel   @relation(fields: [posteId], references: [id])
  lot       Lot          @relation(fields: [lotId], references: [id])
  redevable Personne     @relation("Redevable", fields: [redevableId], references: [id])
  affectations AffectationPaiement[]

  @@index([appelId])
  @@index([redevableId])
  // solde dû = montant − Σ(affectations.montant)
}

// =====================================================================
// PAIEMENTS & AFFECTATIONS  (⚠️ pièce critique n°3 : séparation)
// =====================================================================

enum MoyenPaiement  { ESPECES CHEQUE VIREMENT CARTE MOBILE_MONEY PRELEVEMENT EN_LIGNE }
enum PaiementStatut { EN_ATTENTE VALIDE REJETE ANNULE }

// Un paiement REÇU. Distinct de son affectation aux dettes (règle 10 fondamentale).
model Paiement {
  id             String         @id @default(uuid())
  coproprieteId  String
  payeurId       String         // peut être un tiers payant pour un copropriétaire
  dateOperation  DateTime
  montant        Decimal        @db.Decimal(18, 4)
  moyen          MoyenPaiement
  referenceBancaire String?
  statut         PaiementStatut @default(EN_ATTENTE)
  idempotencyKey String?        @unique // anti double-comptage Mobile Money (règle 10.24)
  createdAt      DateTime       @default(now())

  copropriete  Copropriete @relation(fields: [coproprieteId], references: [id])
  payeur       Personne    @relation("Payeur", fields: [payeurId], references: [id])
  affectations AffectationPaiement[]

  @@index([coproprieteId])
  // montant non affecté (montant − Σ affectations) = avance / crédit du payeur
}

// L'AFFECTATION : impute une partie d'un paiement à une ligne due. Opération séparée.
model AffectationPaiement {
  id             String  @id @default(uuid())
  paiementId     String
  ligneAppelId   String
  montantAffecte Decimal @db.Decimal(18, 4)
  createdAt      DateTime @default(now())

  paiement   Paiement          @relation(fields: [paiementId], references: [id])
  ligneAppel LigneAppelDeFonds @relation(fields: [ligneAppelId], references: [id])

  @@index([paiementId])
  @@index([ligneAppelId])
}

// =====================================================================
// DOCUMENTS (PDF générés : appels, reçus) — métadonnées seulement
// =====================================================================

model Document {
  id            String   @id @default(uuid())
  coproprieteId String
  type          String   // APPEL_PDF | RECU_PDF
  entiteLiee    String?  // ex. "AppelDeFonds" / id
  entiteId      String?
  storageKey    String   // clé S3/MinIO ; le binaire n'est jamais en base
  createdAt     DateTime @default(now())

  @@index([coproprieteId])
}
```

---

## 4. Invariants garantis par ce modèle

1. **Isolation** : `syndicId` / `coproprieteId` partout → RLS applicable.
2. **Propriété M:N** via `DetentionPropriete` — jamais de FK propriétaire sur `Lot`.
3. **Historique de propriété** conservé (dates début/fin, pas de suppression).
4. **Tantièmes versionnés** + **snapshot** figé sur chaque ligne d'appel.
5. **Argent en `Decimal`** partout.
6. **Paiement ≠ affectation** : deux tables distinctes.
7. **Idempotence** Mobile Money via `idempotencyKey @unique`.
8. **Audit append-only** via `AuditLog`.

---

## 5. Points à valider ensemble (avant de geler)

- [ ] **Quote-part** : fraction `Decimal(9,6)` (0..1) — OK, ou tu préfères numérateur/dénominateur (ex. 1/3 exact) ?
- [ ] **Usufruit / nue-propriété** : gérés par `natureDroit` dans la détention. Qui est redevable des charges (usufruitier en général) ? À confirmer selon le droit applicable.
- [ ] **Emails/téléphones** stockés en tableau (`String[]`) pour le MVP — suffisant, ou on fait des tables de contacts dès maintenant ?
- [ ] **Exercice comptable** : pas encore dans le MVP (les appels référencent une date). On l'ajoute en Vague 3 (compta). OK ?
- [ ] **Budget** : hors MVP — l'appel porte directement le `montantARepartir` par poste. OK ?
- [ ] **Relances** : table `Relance` à ajouter pour le suivi des impayés (manquante ici, prévue dans le MVP). Je l'ajoute à la prochaine itération.
