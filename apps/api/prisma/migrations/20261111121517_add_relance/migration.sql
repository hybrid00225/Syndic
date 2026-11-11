-- CreateEnum
CREATE TYPE "CanalRelance" AS ENUM ('EMAIL', 'SMS', 'COURRIER');

-- CreateTable
CREATE TABLE "Relance" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "canal" "CanalRelance" NOT NULL,
    "montantReclame" BIGINT NOT NULL,
    "commentaire" TEXT,
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Relance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Relance_coproprieteId_personneId_idx" ON "Relance"("coproprieteId", "personneId");
