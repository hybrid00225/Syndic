import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  // Le syndic est dérivé du token d'authentification (plus dans le body).
}
