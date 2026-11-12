import { IsInt, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';
import { INT_MAX } from '../../../common/validation';

export class UpdateNiveauDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Max(INT_MAX)
  ordre?: number;
}
