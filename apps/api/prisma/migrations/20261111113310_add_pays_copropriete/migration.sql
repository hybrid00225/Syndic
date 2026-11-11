/*
  Warnings:

  - Added the required column `pays` to the `Copropriete` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Copropriete" ADD COLUMN     "pays" TEXT NOT NULL;
