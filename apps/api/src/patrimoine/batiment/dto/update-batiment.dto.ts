import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateBatimentDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;
}
