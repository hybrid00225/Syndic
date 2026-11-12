import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

// Domaines 1.10-1.11 — une version du règlement de copropriété.
export class CreateReglementDto {
  @IsDateString()
  @IsOptional()
  dateAdoption?: string; // date d'entrée en vigueur

  @IsString()
  @IsOptional()
  reference?: string; // ex. acte notarié

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  documentId?: string; // document téléversé (upload préalable)
}
