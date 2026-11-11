import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { LotType, LotStatut } from '@prisma/client';

export class UpdateLotDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  reference?: string;

  @IsEnum(LotType)
  @IsOptional()
  type?: LotType;

  @IsString()
  @IsOptional()
  designation?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
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
