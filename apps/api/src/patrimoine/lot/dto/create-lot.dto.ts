import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { SUPERFICIE_MAX } from '../../../common/validation';
import { LotType, LotStatut } from '@prisma/client';

export class CreateLotDto {
  @IsString()
  @IsNotEmpty()
  reference: string; // unique dans la copropriété (RG-03)

  @IsEnum(LotType)
  type: LotType;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0) // RG-06 : superficie ≥ 0
  @IsOptional()
  @Max(SUPERFICIE_MAX)
  superficie?: number; // m² — PAS de l'argent

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
