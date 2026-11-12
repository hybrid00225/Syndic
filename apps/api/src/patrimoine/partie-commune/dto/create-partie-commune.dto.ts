import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PartieCommuneType } from '@prisma/client';

// Domaine 1.8 — parties communes générales ou spéciales.
export class CreatePartieCommuneDto {
  @IsString()
  @IsNotEmpty()
  nom: string; // ex. « Hall », « Toiture », « Local vélos »

  @IsEnum(PartieCommuneType)
  @IsOptional()
  type?: PartieCommuneType; // GENERALE (défaut) ou SPECIALE

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  batimentId?: string; // rattachement optionnel (partie spéciale d'un bâtiment)
}
