import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PartieCommuneType } from '@prisma/client';

export class UpdatePartieCommuneDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nom?: string;

  @IsEnum(PartieCommuneType)
  @IsOptional()
  type?: PartieCommuneType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  batimentId?: string | null;
}
