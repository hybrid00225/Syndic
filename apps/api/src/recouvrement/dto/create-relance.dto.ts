import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { INT_MAX } from '../../common/validation';
import { CanalRelance } from '@prisma/client';

export class CreateRelanceDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Max(INT_MAX)
  niveau?: number; // 1 = 1re relance, 2 = mise en demeure...

  @IsEnum(CanalRelance)
  canal: CanalRelance;

  @IsString()
  @IsOptional()
  commentaire?: string;
}
