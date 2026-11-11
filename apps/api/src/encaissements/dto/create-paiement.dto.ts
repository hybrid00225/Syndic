import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { MoyenPaiement, PaiementStatut } from '@prisma/client';

export class CreatePaiementDto {
  @IsUUID()
  payeurId: string;

  @IsInt()
  @Min(1)
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
