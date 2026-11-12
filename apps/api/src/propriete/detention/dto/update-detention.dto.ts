import { IsDateString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { INT_MAX } from '../../../common/validation';

// Mise à jour limitée : surtout clôturer une détention (dateFin) ou corriger la quote-part.
export class UpdateDetentionDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Max(INT_MAX)
  quotePartNum?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Max(INT_MAX)
  quotePartDen?: number;

  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
