import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AccesType } from '@prisma/client';

// Domaine 1.9 — une copropriété peut disposer de plusieurs accès.
export class CreateAccesDto {
  @IsString()
  @IsNotEmpty()
  nom: string; // ex. « Entrée principale », « Portail parking »

  @IsEnum(AccesType)
  @IsOptional()
  type?: AccesType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  batimentId?: string;
}
