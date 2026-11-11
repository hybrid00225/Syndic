-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ADMIN_SYNDIC', 'GESTIONNAIRE', 'COMPTABLE', 'CAISSIER');

-- CreateEnum
CREATE TYPE "CoproprieteStatut" AS ENUM ('EN_CREATION', 'ACTIVE', 'INACTIVE', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "LotType" AS ENUM ('APPARTEMENT', 'PARKING', 'CAVE', 'MAGASIN', 'BUREAU', 'ENTREPOT', 'AUTRE');

-- CreateEnum
CREATE TYPE "LotStatut" AS ENUM ('OCCUPE_PROPRIETAIRE', 'LOUE', 'VACANT', 'EN_TRAVAUX', 'INDISPONIBLE', 'VENDU');

-- CreateTable
CREATE TABLE "Syndic" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Syndic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "mfaActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoproprieteRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,

    CONSTRAINT "UserCoproprieteRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "coproprieteId" TEXT,
    "userId" TEXT,
    "entite" TEXT NOT NULL,
    "entiteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "avant" JSONB,
    "apres" JSONB,
    "horodatage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Copropriete" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "statut" "CoproprieteStatut" NOT NULL DEFAULT 'EN_CREATION',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Copropriete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batiment" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Batiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Niveau" (
    "id" TEXT NOT NULL,
    "batimentId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Niveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "batimentId" TEXT,
    "niveauId" TEXT,
    "reference" TEXT NOT NULL,
    "type" "LotType" NOT NULL,
    "designation" TEXT,
    "superficie" DECIMAL(10,2),
    "statut" "LotStatut" NOT NULL DEFAULT 'VACANT',

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_syndicId_idx" ON "User"("syndicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCoproprieteRole_userId_coproprieteId_role_key" ON "UserCoproprieteRole"("userId", "coproprieteId", "role");

-- CreateIndex
CREATE INDEX "AuditLog_entite_entiteId_idx" ON "AuditLog"("entite", "entiteId");

-- CreateIndex
CREATE INDEX "AuditLog_coproprieteId_idx" ON "AuditLog"("coproprieteId");

-- CreateIndex
CREATE INDEX "Copropriete_syndicId_idx" ON "Copropriete"("syndicId");

-- CreateIndex
CREATE INDEX "Batiment_coproprieteId_idx" ON "Batiment"("coproprieteId");

-- CreateIndex
CREATE INDEX "Niveau_batimentId_idx" ON "Niveau"("batimentId");

-- CreateIndex
CREATE INDEX "Lot_coproprieteId_idx" ON "Lot"("coproprieteId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_coproprieteId_reference_key" ON "Lot"("coproprieteId", "reference");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoproprieteRole" ADD CONSTRAINT "UserCoproprieteRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoproprieteRole" ADD CONSTRAINT "UserCoproprieteRole_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Copropriete" ADD CONSTRAINT "Copropriete_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batiment" ADD CONSTRAINT "Batiment_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Niveau" ADD CONSTRAINT "Niveau_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "Batiment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "Batiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "Niveau"("id") ON DELETE SET NULL ON UPDATE CASCADE;
