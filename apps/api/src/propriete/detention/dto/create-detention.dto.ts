import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { NatureDroit } from '@prisma/client';

export class CreateDetentionDto {
  @IsUUID()
  personneId: string;

  @IsInt()
  @Min(1)
  quotePartNum: number;

  @IsInt()
  @Min(1)
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
