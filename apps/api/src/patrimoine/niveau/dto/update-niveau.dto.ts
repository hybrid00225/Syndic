import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdateNiveauDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  ordre?: number;
}
