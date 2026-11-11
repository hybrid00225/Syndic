-- CreateTable
CREATE TABLE "CleRepartition" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CleRepartition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleRepartitionVersion" (
    "id" TEXT NOT NULL,
    "cleId" TEXT NOT NULL,
    "dateEffet" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "totalTantiemes" INTEGER NOT NULL,

    CONSTRAINT "CleRepartitionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tantieme" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "valeur" INTEGER NOT NULL,

    CONSTRAINT "Tantieme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CleRepartition_coproprieteId_idx" ON "CleRepartition"("coproprieteId");

-- CreateIndex
CREATE INDEX "CleRepartitionVersion_cleId_dateEffet_idx" ON "CleRepartitionVersion"("cleId", "dateEffet");

-- CreateIndex
CREATE UNIQUE INDEX "Tantieme_versionId_lotId_key" ON "Tantieme"("versionId", "lotId");

-- AddForeignKey
ALTER TABLE "CleRepartition" ADD CONSTRAINT "CleRepartition_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleRepartitionVersion" ADD CONSTRAINT "CleRepartitionVersion_cleId_fkey" FOREIGN KEY ("cleId") REFERENCES "CleRepartition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tantieme" ADD CONSTRAINT "Tantieme_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "CleRepartitionVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tantieme" ADD CONSTRAINT "Tantieme_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
