import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Mise à jour d'un exercice OUVERT (un exercice clôturé est verrouillé — règle 25.7).
export class UpdateExerciceDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  libelle?: string;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
