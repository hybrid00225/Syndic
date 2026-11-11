import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePersonneDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  prenom?: string;

  @IsBoolean()
  @IsOptional()
  actif?: boolean;
}
