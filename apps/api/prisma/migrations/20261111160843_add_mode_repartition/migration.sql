-- CreateEnum
CREATE TYPE "ModeRepartition" AS ENUM ('TANTIEMES', 'CLES_REPARTITION', 'MONTANT_FIXE', 'MIXTE');

-- AlterTable
ALTER TABLE "Copropriete" ADD COLUMN     "modeRepartition" "ModeRepartition" NOT NULL DEFAULT 'TANTIEMES';
