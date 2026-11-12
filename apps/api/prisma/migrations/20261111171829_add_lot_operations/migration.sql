-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LotStatut" ADD VALUE 'FUSIONNE';
ALTER TYPE "LotStatut" ADD VALUE 'SUBDIVISE';

-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "lotPrincipalId" TEXT,
ADD COLUMN     "origineLotId" TEXT;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_lotPrincipalId_fkey" FOREIGN KEY ("lotPrincipalId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_origineLotId_fkey" FOREIGN KEY ("origineLotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
