import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// Inscription : crée un syndic + son premier utilisateur administrateur.
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  syndicNom: string;

  @IsString()
  @IsNotEmpty()
  pays: string;

  @IsString()
  @IsOptional()
  devise?: string;

  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  motDePasse: string;
}
