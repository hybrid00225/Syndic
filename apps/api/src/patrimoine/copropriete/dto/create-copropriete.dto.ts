import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CoproprieteType, NatureSyndic } from '@prisma/client';

export class CreateCoproprieteDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsOptional()
  reference?: string; // code interne

  @IsEnum(CoproprieteType)
  @IsOptional()
  type?: CoproprieteType; // RESIDENTIEL / COMMERCIAL / MIXTE (règle 1.7)

  @IsString()
  @IsNotEmpty()
  pays: string; // code ISO — pilote les règles juridiques

  @IsString()
  @IsOptional()
  adresse?: string;

  @IsString()
  @IsOptional()
  ensembleImmobilier?: string; // rattachement résidence/ensemble (règle 1.16)

  @IsString()
  @IsOptional()
  devise?: string; // défaut XOF côté service (règle 1.13)

  @IsEnum(NatureSyndic)
  @IsOptional()
  natureSyndic?: NatureSyndic; // professionnel / bénévole (règle 1.18)

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  dateMiseExploitation?: string; // règle 1.14
  // Le syndic est dérivé du token d'authentification.
}
