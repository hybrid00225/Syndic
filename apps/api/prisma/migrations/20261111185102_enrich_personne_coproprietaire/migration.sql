-- CreateEnum
CREATE TYPE "PersonneStatut" AS ENUM ('ACTIF', 'SUSPENDU', 'DECEDE', 'SUCCESSION');

-- CreateEnum
CREATE TYPE "ModeNotification" AS ENUM ('EMAIL', 'SMS', 'COURRIER', 'AUCUN');

-- CreateEnum
CREATE TYPE "NatureRepresentation" AS ENUM ('MANDATAIRE', 'TUTEUR', 'REPRESENTANT_LEGAL');

-- AlterTable
ALTER TABLE "Personne" ADD COLUMN     "modeNotification" "ModeNotification" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "natureRepresentation" "NatureRepresentation",
ADD COLUMN     "representantId" TEXT,
ADD COLUMN     "statut" "PersonneStatut" NOT NULL DEFAULT 'ACTIF';

-- AddForeignKey
ALTER TABLE "Personne" ADD CONSTRAINT "Personne_representantId_fkey" FOREIGN KEY ("representantId") REFERENCES "Personne"("id") ON DELETE SET NULL ON UPDATE CASCADE;
