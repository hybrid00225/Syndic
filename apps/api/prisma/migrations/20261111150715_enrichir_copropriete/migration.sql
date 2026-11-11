-- CreateEnum
CREATE TYPE "CoproprieteType" AS ENUM ('RESIDENTIEL', 'COMMERCIAL', 'MIXTE');

-- CreateEnum
CREATE TYPE "NatureSyndic" AS ENUM ('PROFESSIONNEL', 'BENEVOLE');

-- AlterTable
ALTER TABLE "Copropriete" ADD COLUMN     "dateMiseExploitation" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "ensembleImmobilier" TEXT,
ADD COLUMN     "natureSyndic" "NatureSyndic" NOT NULL DEFAULT 'PROFESSIONNEL',
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "type" "CoproprieteType" NOT NULL DEFAULT 'RESIDENTIEL';
