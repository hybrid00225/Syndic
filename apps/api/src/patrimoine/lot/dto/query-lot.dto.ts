import { IsEnum, IsOptional } from 'class-validator';
import { LotType, LotStatut } from '@prisma/client';

export class QueryLotDto {
  @IsEnum(LotType)
  @IsOptional()
  type?: LotType;

  @IsEnum(LotStatut)
  @IsOptional()
  statut?: LotStatut;
}
