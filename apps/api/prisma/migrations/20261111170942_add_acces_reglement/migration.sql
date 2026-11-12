-- CreateEnum
CREATE TYPE "AccesType" AS ENUM ('PIETON', 'VEHICULE', 'PARKING', 'LIVRAISON', 'SECOURS', 'AUTRE');

-- CreateTable
CREATE TABLE "Acces" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "batimentId" TEXT,
    "nom" TEXT NOT NULL,
    "type" "AccesType" NOT NULL DEFAULT 'PIETON',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Acces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReglementVersion" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "dateAdoption" TIMESTAMP(3),
    "reference" TEXT,
    "description" TEXT,
    "fichierUrl" TEXT,
    "courant" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReglementVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Acces_coproprieteId_idx" ON "Acces"("coproprieteId");

-- CreateIndex
CREATE INDEX "ReglementVersion_coproprieteId_idx" ON "ReglementVersion"("coproprieteId");

-- AddForeignKey
ALTER TABLE "Acces" ADD CONSTRAINT "Acces_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Acces" ADD CONSTRAINT "Acces_batimentId_fkey" FOREIGN KEY ("batimentId") REFERENCES "Batiment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReglementVersion" ADD CONSTRAINT "ReglementVersion_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
