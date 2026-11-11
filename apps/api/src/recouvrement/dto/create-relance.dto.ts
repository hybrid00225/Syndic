import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CanalRelance } from '@prisma/client';

export class CreateRelanceDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  niveau?: number; // 1 = 1re relance, 2 = mise en demeure...

  @IsEnum(CanalRelance)
  canal: CanalRelance;

  @IsString()
  @IsOptional()
  commentaire?: string;
}
