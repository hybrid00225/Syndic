import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { MONTANT_MAX } from '../../common/validation';
import { MoyenPaiement, PaiementStatut } from '@prisma/client';

export class CreatePaiementDto {
  @IsUUID()
  payeurId: string;

  @IsInt()
  @Min(1)
  @Max(MONTANT_MAX)
  montant: number; // entier (unité de la devise)

  @IsEnum(MoyenPaiement)
  moyen: MoyenPaiement;

  @IsDateString()
  @IsOptional()
  dateOperation?: string; // défaut : maintenant

  @IsString()
  @IsOptional()
  referenceBancaire?: string;

  @IsEnum(PaiementStatut)
  @IsOptional()
  statut?: PaiementStatut; // défaut VALIDE

  // Clé d'idempotence (ex. identifiant de transaction Mobile Money) : anti double-comptage.
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
