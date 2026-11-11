import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { AppelType } from '@prisma/client';

export class PosteInputDto {
  @IsUUID()
  cleId: string;

  @IsString()
  @IsNotEmpty()
  libelle: string;

  @IsInt()
  @Min(1)
  montantARepartir: number; // entier (unité de la devise)
}

export class CreateAppelDto {
  @IsString()
  @IsNotEmpty()
  motif: string;

  @IsEnum(AppelType)
  @IsOptional()
  type?: AppelType;

  @IsDateString()
  @IsOptional()
  dateEmission?: string; // défaut : maintenant (sert à choisir la version de clé)

  @IsDateString()
  dateEcheance: string; // date d'exigibilité (sert à déterminer le redevable)

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PosteInputDto)
  postes: PosteInputDto[];
}
