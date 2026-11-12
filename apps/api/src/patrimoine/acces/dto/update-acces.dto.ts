import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AccesType } from '@prisma/client';

export class UpdateAccesDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsEnum(AccesType)
  @IsOptional()
  type?: AccesType;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsUUID()
  @IsOptional()
  batimentId?: string | null;
}
