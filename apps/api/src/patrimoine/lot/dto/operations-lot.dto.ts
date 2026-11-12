import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { LotStatut, LotType } from '@prisma/client';

// Données d'un nouveau lot créé par fusion ou subdivision.
export class LotNouveauInput {
  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsEnum(LotType)
  type: LotType;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  superficie?: number;

  @IsEnum(LotStatut)
  @IsOptional()
  statut?: LotStatut;

  @IsUUID()
  @IsOptional()
  batimentId?: string;

  @IsUUID()
  @IsOptional()
  niveauId?: string;
}

// Rattacher un lot (annexe) à un lot principal — règle 2.11.
export class AnnexerLotDto {
  @IsUUID()
  lotPrincipalId: string;
}

// Changement de destination — règle 2.15.
export class ChangerDestinationDto {
  @IsEnum(LotType)
  type: LotType;

  @IsString()
  @IsOptional()
  designation?: string;
}

// Fusion de plusieurs lots en un seul — règle 2.13.
export class FusionLotDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  sourceLotIds: string[];

  @ValidateNested()
  @Type(() => LotNouveauInput)
  nouveau: LotNouveauInput;
}

// Subdivision d'un lot en plusieurs — règle 2.14.
export class SubdivisionLotDto {
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => LotNouveauInput)
  nouveaux: LotNouveauInput[];
}
