import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { INT_MAX } from '../../../common/validation';
import { NatureDroit } from '@prisma/client';

export class CreateDetentionDto {
  @IsUUID()
  personneId: string;

  @IsInt()
  @Min(1)
  @Max(INT_MAX)
  quotePartNum: number;

  @IsInt()
  @Min(1)
  @Max(INT_MAX)
  quotePartDen: number;

  @IsEnum(NatureDroit)
  @IsOptional()
  natureDroit?: NatureDroit;

  @IsDateString()
  dateDebut: string;

  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
