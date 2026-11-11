import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

// Mise à jour limitée : surtout clôturer une détention (dateFin) ou corriger la quote-part.
export class UpdateDetentionDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  quotePartNum?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  quotePartDen?: number;

  @IsDateString()
  @IsOptional()
  dateFin?: string;
}
