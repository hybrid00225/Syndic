import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EquipementCategorie, EquipementEtat } from '@prisma/client';

export class QueryEquipementDto {
  @IsUUID()
  @IsOptional()
  coproprieteId?: string;

  @IsUUID()
  @IsOptional()
  batimentId?: string;

  @IsEnum(EquipementCategorie)
  @IsOptional()
  categorie?: EquipementCategorie;

  @IsEnum(EquipementEtat)
  @IsOptional()
  etat?: EquipementEtat;
}
