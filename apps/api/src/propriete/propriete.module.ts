import { Module } from '@nestjs/common';
import { PersonneController } from './personne/personne.controller';
import { PersonneService } from './personne/personne.service';
import { DetentionController } from './detention/detention.controller';
import { DetentionService } from './detention/detention.service';

// Module 02 — Propriété & Copropriétaires (Personne, Contact, DetentionPropriete).
@Module({
  controllers: [PersonneController, DetentionController],
  providers: [PersonneService, DetentionService],
  exports: [PersonneService, DetentionService],
})
export class ProprieteModule {}
