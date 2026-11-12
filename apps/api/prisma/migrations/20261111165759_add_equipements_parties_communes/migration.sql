-- CreateEnum
CREATE TYPE "PartieCommuneType" AS ENUM ('GENERALE', 'SPECIALE');

-- CreateEnum
CREATE TYPE "EquipementCategorie" AS ENUM ('ASCENSEUR', 'GROUPE_ELECTROGENE', 'POMPE', 'SURPRESSEUR', 'RESERVOIR_EAU', 'PORTAIL', 'CAMERA', 'SYSTEME_INCENDIE', 'PISCINE', 'CLIMATISATION', 'INSTALLATION_ELECTRIQUE', 'ECLAIRAGE', 'CONTROLE_ACCES', 'AUTRE');

-- CreateEnum
CREATE TYPE "EquipementEtat" AS ENUM ('EN_SERVICE', 'EN_PANNE', 'EN_MAINTENANCE', 'HORS_SERVICE', 'REMPLACE');

-- CreateTable
CREATE TABLE "PartieCommune" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "batimentId" TEXT,
    "nom" TEXT NOT NULL,
    "type" "PartieCommuneType" NOT NULL DEFAULT 'GENERALE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartieCommune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipement" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "batimentId" TEXT,
    "partieCommuneId" TEXT,
    "nom" TEXT NOT NULL,
    "categorie" "EquipementCategorie" NOT NULL,
    "reference" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "dateInstallation" TIMESTAMP(3),
    "garantieFin" TIMESTAMP(3),
    "fournisseur" TEXT,
    "etat" "EquipementEtat" NOT NULL DEFAULT 'EN_SERVICE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Equipement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartieCommune_coproprieteId_idx" ON "PartieCommune"("coproprieteId");

-- CreateIndex
CREATE INDEX "Equipement_coproprieteId_idx" ON "Equipement"("coproprieteId");

-- CreateIndex
CREATE INDEX "Equipement_batimentId_idx" ON "Equipement"("batimentId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipement_coproprieteId_reference_key" ON "Equipement"("coproprieteId", "reference");

-- AddForeignKey
ALTER TABLE "PartieCommune" ADD CONSTRAINT "PartieCommune_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartieCommune" ADD CONSTRAINT "PartieCommune_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "Batiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipement" ADD CONSTRAINT "Equipement_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipement" ADD CONSTRAINT "Equipement_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "Batiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipement" ADD CONSTRAINT "Equipement_partieCommuneId_fkey" FOREIGN KEY ("partieCommuneId") REFERENCES "PartieCommune"("id") ON DELETE SET NULL ON UPDATE CASCADE;
