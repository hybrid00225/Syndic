import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PosteBudgetInputDto } from './create-budget.dto';

// Mise à jour d'un budget en BROUILLON : libellé et/ou remplacement des postes.
export class UpdateBudgetDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  libelle?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PosteBudgetInputDto)
  @IsOptional()
  postes?: PosteBudgetInputDto[];
}
