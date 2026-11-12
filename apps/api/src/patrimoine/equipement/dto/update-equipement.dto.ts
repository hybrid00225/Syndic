import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EquipementCategorie, EquipementEtat } from '@prisma/client';

export class UpdateEquipementDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsEnum(EquipementCategorie)
  @IsOptional()
  categorie?: EquipementCategorie;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  reference?: string;

  @IsString()
  @IsOptional()
  numeroSerie?: string | null;

  @IsDateString()
  @IsOptional()
  dateInstallation?: string | null;

  @IsDateString()
  @IsOptional()
  garantieFin?: string | null;

  @IsString()
  @IsOptional()
  fournisseur?: string | null;

  @IsEnum(EquipementEtat)
  @IsOptional()
  etat?: EquipementEtat;

  @IsString()
  @IsOptional()
  notes?: string | null;

  @IsUUID()
  @IsOptional()
  batimentId?: string | null;

  @IsUUID()
  @IsOptional()
  partieCommuneId?: string | null;
}
