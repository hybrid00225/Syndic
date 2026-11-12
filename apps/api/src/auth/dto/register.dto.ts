import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EmailNormalise, MotDePasseRobuste } from '../../common/validation';

// Inscription : crée un syndic + son premier utilisateur administrateur.
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  syndicNom: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  pays: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  devise?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nom: string;

  @EmailNormalise()
  email: string;

  @IsString()
  @MotDePasseRobuste()
  motDePasse: string;
}
