import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

// Domaine 25 — un exercice comptable : libellé + bornes (règles 25.2, 25.3).
export class CreateExerciceDto {
  @IsString()
  @IsNotEmpty()
  libelle: string; // ex. « Exercice 2026 »

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  dateFin: string;
}
