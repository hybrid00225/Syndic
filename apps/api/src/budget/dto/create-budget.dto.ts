import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { MONTANT_MAX } from '../../common/validation';
import { NaturePoste } from '@prisma/client';

// Un poste de dépense prévue (règles 8.6 à 8.10).
export class PosteBudgetInputDto {
  @IsString()
  @IsNotEmpty()
  libelle: string; // ex. « Gardiennage »

  @IsString()
  @IsOptional()
  categorie?: string; // catégorie comptable (règle 8.7)

  @IsUUID()
  @IsOptional()
  cleId?: string; // clé de répartition associée (règle 8.8)

  @IsEnum(NaturePoste)
  @IsOptional()
  nature?: NaturePoste; // récurrente (défaut) ou exceptionnelle (règles 8.9/8.10)

  @IsInt()
  @Min(1)
  @Max(MONTANT_MAX)
  montantPrevu: number; // entier, unité de la devise de la copropriété
}

// Un budget prévisionnel rattaché à un exercice (règles 8.1, 8.6).
export class CreateBudgetDto {
  @IsUUID()
  exerciceId: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  libelle?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PosteBudgetInputDto)
  @ArrayMaxSize(500)
  postes: PosteBudgetInputDto[];
}
