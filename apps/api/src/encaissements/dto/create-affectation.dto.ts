import { IsInt, IsUUID, Min, Max } from 'class-validator';
import { MONTANT_MAX } from '../../common/validation';

export class CreateAffectationDto {
  @IsUUID()
  ligneAppelId: string;

  @IsInt()
  @Min(1)
  @Max(MONTANT_MAX)
  montantAffecte: number; // entier (unité de la devise)
}
