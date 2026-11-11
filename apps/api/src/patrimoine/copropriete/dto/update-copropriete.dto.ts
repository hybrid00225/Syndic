import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import {
  CoproprieteStatut,
  CoproprieteType,
  ModeRepartition,
  NatureSyndic,
} from '@prisma/client';

export class UpdateCoproprieteDto {
  @IsString()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsEnum(CoproprieteType)
  @IsOptional()
  type?: CoproprieteType;

  @IsString()
  @IsOptional()
  pays?: string;

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ensembleImmobilier?: string;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsEnum(NatureSyndic)
  @IsOptional()
  natureSyndic?: NatureSyndic;

  @IsEnum(ModeRepartition)
  @IsOptional()
  modeRepartition?: ModeRepartition;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CoproprieteStatut)
  @IsOptional()
  statut?: CoproprieteStatut;

  @IsDateString()
  @IsOptional()
  dateMiseExploitation?: string;
}
