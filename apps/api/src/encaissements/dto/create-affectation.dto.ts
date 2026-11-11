import { IsInt, IsUUID, Min } from 'class-validator';

export class CreateAffectationDto {
  @IsUUID()
  ligneAppelId: string;

  @IsInt()
  @Min(1)
  montantAffecte: number; // entier (unité de la devise)
}
