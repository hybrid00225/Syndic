import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCoproprieteDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsNotEmpty()
  pays: string; // code ISO — pilote les règles juridiques

  @IsString()
  @IsOptional()
  devise?: string; // défaut XOF côté service

  @IsString()
  @IsOptional()
  adresse?: string;

  // ⚠️ TEMPORAIRE : sera dérivé du token d'authentification une fois le module Auth prêt.
  @IsUUID()
  syndicId: string;
}
