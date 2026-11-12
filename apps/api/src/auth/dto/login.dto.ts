import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { EmailNormalise } from '../../common/validation';

export class LoginDto {
  @EmailNormalise()
  email: string;

  // Pas de politique ici (comptes existants) : seulement une borne de taille.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motDePasse: string;
}
