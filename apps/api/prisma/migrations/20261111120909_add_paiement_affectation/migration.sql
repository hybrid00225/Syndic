-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE', 'MOBILE_MONEY', 'PRELEVEMENT', 'EN_LIGNE');

-- CreateEnum
CREATE TYPE "PaiementStatut" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE', 'ANNULE');

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "payeurId" TEXT NOT NULL,
    "dateOperation" TIMESTAMP(3) NOT NULL,
    "montant" BIGINT NOT NULL,
    "moyen" "MoyenPaiement" NOT NULL,
    "referenceBancaire" TEXT,
    "statut" "PaiementStatut" NOT NULL DEFAULT 'VALIDE',
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffectationPaiement" (
    "id" TEXT NOT NULL,
    "paiementId" TEXT NOT NULL,
    "ligneAppelId" TEXT NOT NULL,
    "montantAffecte" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffectationPaiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Paiement_idempotencyKey_key" ON "Paiement"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Paiement_coproprieteId_idx" ON "Paiement"("coproprieteId");

-- CreateIndex
CREATE INDEX "AffectationPaiement_paiementId_idx" ON "AffectationPaiement"("paiementId");

-- CreateIndex
CREATE INDEX "AffectationPaiement_ligneAppelId_idx" ON "AffectationPaiement"("ligneAppelId");

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_payeurId_fkey" FOREIGN KEY ("payeurId") REFERENCES "Personne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationPaiement" ADD CONSTRAINT "AffectationPaiement_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "Paiement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectationPaiement" ADD CONSTRAINT "AffectationPaiement_ligneAppelId_fkey" FOREIGN KEY ("ligneAppelId") REFERENCES "LigneAppelDeFonds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
