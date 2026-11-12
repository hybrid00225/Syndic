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
  @Max(SUPERFICIE_MAX)
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
