import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCleDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
