-- CreateEnum
CREATE TYPE "AppelType" AS ENUM ('ORDINAIRE', 'EXCEPTIONNEL');

-- CreateEnum
CREATE TYPE "AppelStatut" AS ENUM ('BROUILLON', 'VALIDE', 'ANNULE');

-- CreateTable
CREATE TABLE "AppelDeFonds" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "AppelType" NOT NULL DEFAULT 'ORDINAIRE',
    "motif" TEXT NOT NULL,
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "statut" "AppelStatut" NOT NULL DEFAULT 'BROUILLON',

    CONSTRAINT "AppelDeFonds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosteAppel" (
    "id" TEXT NOT NULL,
    "appelId" TEXT NOT NULL,
    "cleVersionId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montantARepartir" BIGINT NOT NULL,

    CONSTRAINT "PosteAppel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneAppelDeFonds" (
    "id" TEXT NOT NULL,
    "appelId" TEXT NOT NULL,
    "posteId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "redevableId" TEXT NOT NULL,
    "tantiemeSnapshot" INTEGER NOT NULL,
    "totalSnapshot" INTEGER NOT NULL,
    "montant" BIGINT NOT NULL,

    CONSTRAINT "LigneAppelDeFonds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppelDeFonds_coproprieteId_idx" ON "AppelDeFonds"("coproprieteId");

-- CreateIndex
CREATE UNIQUE INDEX "AppelDeFonds_coproprieteId_numero_key" ON "AppelDeFonds"("coproprieteId", "numero");

-- CreateIndex
CREATE INDEX "LigneAppelDeFonds_appelId_idx" ON "LigneAppelDeFonds"("appelId");

-- CreateIndex
CREATE INDEX "LigneAppelDeFonds_redevableId_idx" ON "LigneAppelDeFonds"("redevableId");

-- AddForeignKey
ALTER TABLE "AppelDeFonds" ADD CONSTRAINT "AppelDeFonds_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosteAppel" ADD CONSTRAINT "PosteAppel_appelId_fkey" FOREIGN KEY ("appelId") REFERENCES "AppelDeFonds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosteAppel" ADD CONSTRAINT "PosteAppel_cleVersionId_fkey" FOREIGN KEY ("cleVersionId") REFERENCES "CleRepartitionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAppelDeFonds" ADD CONSTRAINT "LigneAppelDeFonds_appelId_fkey" FOREIGN KEY ("appelId") REFERENCES "AppelDeFonds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAppelDeFonds" ADD CONSTRAINT "LigneAppelDeFonds_posteId_fkey" FOREIGN KEY ("posteId") REFERENCES "PosteAppel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAppelDeFonds" ADD CONSTRAINT "LigneAppelDeFonds_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneAppelDeFonds" ADD CONSTRAINT "LigneAppelDeFonds_redevableId_fkey" FOREIGN KEY ("redevableId") REFERENCES "Personne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
