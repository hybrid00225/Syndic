import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CoproprieteStatut } from '@prisma/client';

export class UpdateCoproprieteDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsEnum(CoproprieteStatut)
  @IsOptional()
  statut?: CoproprieteStatut;
}
