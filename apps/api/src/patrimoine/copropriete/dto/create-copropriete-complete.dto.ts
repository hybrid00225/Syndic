import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { LotStatut, LotType } from '@prisma/client';
import { INT_MAX, SUPERFICIE_MAX } from '../../../common/validation';
import { CreateCoproprieteDto } from './create-copropriete.dto';

export class NiveauInput {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsInt()
  @IsOptional()
  @Max(INT_MAX)
  ordre?: number;
}

export class BatimentInput {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NiveauInput)
  @IsOptional()
  @ArrayMaxSize(200)
  niveaux?: NiveauInput[];
}

export class LotInput {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsEnum(LotType)
  @IsOptional()
  type?: LotType;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Max(SUPERFICIE_MAX)
  superficie?: number;

  @IsEnum(LotStatut)
  @IsOptional()
  statut?: LotStatut;

  // Indices dans les tableaux batiments / niveaux (rattachement).
  @IsInt()
  @IsOptional()
  @Max(INT_MAX)
  batimentIndex?: number;

  @IsInt()
  @IsOptional()
  @Max(INT_MAX)
  niveauIndex?: number;
}

// Création complète : copropriété + bâtiments/niveaux + lots, en une transaction.
export class CreateCoproprieteCompleteDto extends CreateCoproprieteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatimentInput)
  @IsOptional()
  @ArrayMaxSize(200)
  batiments?: BatimentInput[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LotInput)
  @IsOptional()
  @ArrayMaxSize(5000)
  lots?: LotInput[];
}
