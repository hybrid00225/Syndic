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
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { MONTANT_MAX } from '../../common/validation';
import { AppelType } from '@prisma/client';

export class PosteInputDto {
  @IsUUID()
  cleId: string;

  @IsString()
  @IsNotEmpty()
  libelle: string;

  @IsInt()
  @Min(1)
  @Max(MONTANT_MAX)
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
  @ArrayMaxSize(200)
  postes: PosteInputDto[];
}
