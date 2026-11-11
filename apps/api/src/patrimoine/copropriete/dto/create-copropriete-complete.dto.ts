import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateCoproprieteDto } from './create-copropriete.dto';

export class NiveauInput {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsInt()
  @IsOptional()
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
  niveaux?: NiveauInput[];
}

export class LotInput {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  superficie?: number;

  @IsString()
  @IsOptional()
  statut?: string;

  // Indices dans les tableaux batiments / niveaux (rattachement).
  @IsInt()
  @IsOptional()
  batimentIndex?: number;

  @IsInt()
  @IsOptional()
  niveauIndex?: number;
}

// Création complète : copropriété + bâtiments/niveaux + lots, en une transaction.
export class CreateCoproprieteCompleteDto extends CreateCoproprieteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatimentInput)
  @IsOptional()
  batiments?: BatimentInput[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LotInput)
  @IsOptional()
  lots?: LotInput[];
}
