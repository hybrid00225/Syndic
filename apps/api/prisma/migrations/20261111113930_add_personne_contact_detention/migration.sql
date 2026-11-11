-- CreateEnum
CREATE TYPE "PersonneType" AS ENUM ('PHYSIQUE', 'MORALE');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('EMAIL', 'TELEPHONE', 'ADRESSE_POSTALE');

-- CreateEnum
CREATE TYPE "NatureDroit" AS ENUM ('PLEINE_PROPRIETE', 'USUFRUIT', 'NUE_PROPRIETE', 'INDIVISION');

-- CreateTable
CREATE TABLE "Personne" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "type" "PersonneType" NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Personne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "valeur" TEXT NOT NULL,
    "libelle" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetentionPropriete" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "quotePartNum" INTEGER NOT NULL,
    "quotePartDen" INTEGER NOT NULL,
    "natureDroit" "NatureDroit" NOT NULL DEFAULT 'PLEINE_PROPRIETE',
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "DetentionPropriete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Personne_syndicId_idx" ON "Personne"("syndicId");

-- CreateIndex
CREATE INDEX "Contact_personneId_idx" ON "Contact"("personneId");

-- CreateIndex
CREATE INDEX "DetentionPropriete_lotId_dateDebut_idx" ON "DetentionPropriete"("lotId", "dateDebut");

-- CreateIndex
CREATE INDEX "DetentionPropriete_personneId_idx" ON "DetentionPropriete"("personneId");

-- AddForeignKey
ALTER TABLE "Personne" ADD CONSTRAINT "Personne_syndicId_fkey" FOREIGN KEY ("syndicId") REFERENCES "Syndic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetentionPropriete" ADD CONSTRAINT "DetentionPropriete_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetentionPropriete" ADD CONSTRAINT "DetentionPropriete_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "Personne"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
