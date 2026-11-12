-- CreateEnum
CREATE TYPE "ExerciceStatut" AS ENUM ('OUVERT', 'EN_CLOTURE', 'CLOTURE');

-- CreateEnum
CREATE TYPE "BudgetStatut" AS ENUM ('BROUILLON', 'SOUMIS', 'APPROUVE', 'REJETE');

-- CreateEnum
CREATE TYPE "NaturePoste" AS ENUM ('RECURRENTE', 'EXCEPTIONNELLE');

-- CreateTable
CREATE TABLE "Exercice" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "statut" "ExerciceStatut" NOT NULL DEFAULT 'OUVERT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exercice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "coproprieteId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "libelle" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "statut" "BudgetStatut" NOT NULL DEFAULT 'BROUILLON',
    "dateApprobation" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosteBudget" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "categorie" TEXT,
    "cleId" TEXT,
    "nature" "NaturePoste" NOT NULL DEFAULT 'RECURRENTE',
    "montantPrevu" BIGINT NOT NULL,

    CONSTRAINT "PosteBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Exercice_coproprieteId_idx" ON "Exercice"("coproprieteId");

-- CreateIndex
CREATE INDEX "Budget_coproprieteId_idx" ON "Budget"("coproprieteId");

-- CreateIndex
CREATE INDEX "Budget_exerciceId_idx" ON "Budget"("exerciceId");

-- CreateIndex
CREATE INDEX "PosteBudget_budgetId_idx" ON "PosteBudget"("budgetId");

-- AddForeignKey
ALTER TABLE "Exercice" ADD CONSTRAINT "Exercice_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_coproprieteId_fkey" FOREIGN KEY ("coproprieteId") REFERENCES "Copropriete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosteBudget" ADD CONSTRAINT "PosteBudget_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosteBudget" ADD CONSTRAINT "PosteBudget_cleId_fkey" FOREIGN KEY ("cleId") REFERENCES "CleRepartition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
