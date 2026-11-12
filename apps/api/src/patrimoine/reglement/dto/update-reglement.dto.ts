import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateReglementDto {
  @IsDateString()
  @IsOptional()
  dateAdoption?: string | null;

  @IsString()
  @IsOptional()
  reference?: string | null;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsUUID()
  @IsOptional()
  documentId?: string | null;
}
