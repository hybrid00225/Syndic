import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCleDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsString()
  @IsOptional()
  description?: string;
}
