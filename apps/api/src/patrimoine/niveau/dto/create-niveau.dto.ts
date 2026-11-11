import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateNiveauDto {
  @IsString()
  @IsNotEmpty()
  nom: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  ordre?: number;
}
