import { IsEnum } from 'class-validator';
import { EquipementEtat } from '@prisma/client';

export class ChangerEtatDto {
  @IsEnum(EquipementEtat)
  etat: EquipementEtat;
}
