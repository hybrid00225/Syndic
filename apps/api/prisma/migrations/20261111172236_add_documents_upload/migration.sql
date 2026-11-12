/*
  Warnings:

  - You are about to drop the column `fichierUrl` on the `ReglementVersion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ReglementVersion" DROP COLUMN "fichierUrl",
ADD COLUMN     "documentId" TEXT;

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "syndicId" TEXT NOT NULL,
    "coproprieteId" TEXT,
    "nomOriginal" TEXT NOT NULL,
    "cheminStockage" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "taille" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_coproprieteId_idx" ON "Document"("coproprieteId");

-- AddForeignKey
ALTER TABLE "ReglementVersion" ADD CONSTRAINT "ReglementVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE SET NULL ON UPDATE CASCADE;
