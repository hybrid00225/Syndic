import { Module } from '@nestjs/common';
import { PaiementController } from './paiement.controller';
import { PaiementService } from './paiement.service';

// Module 05 — Encaissements & paiements (paiement ≠ affectation).
@Module({
  controllers: [PaiementController],
  providers: [PaiementService],
  exports: [PaiementService],
})
export class EncaissementsModule {}
