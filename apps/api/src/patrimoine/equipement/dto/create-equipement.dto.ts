import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EquipementCategorie, EquipementEtat } from '@prisma/client';

// Domaine 7 — inventaire technique.
export class CreateEquipementDto {
  @IsString()
  @IsNotEmpty()
  nom: string; // ex. « Ascenseur A »

  @IsEnum(EquipementCategorie)
  categorie: EquipementCategorie; // règle 7.5

  @IsString()
  @IsNotEmpty()
  reference: string; // règle 7.6 (unique dans la copropriété)

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsDateString()
  @IsOptional()
  dateInstallation?: string;

  @IsDateString()
  @IsOptional()
  garantieFin?: string; // fin de garantie (règle 7.9)

  @IsString()
  @IsOptional()
  fournisseur?: string; // texte libre (module Prestataires à venir)

  @IsEnum(EquipementEtat)
  @IsOptional()
  etat?: EquipementEtat; // EN_SERVICE par défaut

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  batimentId?: string; // affecté à un bâtiment (règle 7.3)

  @IsUUID()
  @IsOptional()
  partieCommuneId?: string; // situé dans une partie commune (règle 7.4)
}
