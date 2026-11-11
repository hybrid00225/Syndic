import { Module } from '@nestjs/common';
import { CoproprieteController } from './copropriete/copropriete.controller';
import { CoproprieteService } from './copropriete/copropriete.service';
import { BatimentController } from './batiment/batiment.controller';
import { BatimentService } from './batiment/batiment.service';
import { NiveauController } from './niveau/niveau.controller';
import { NiveauService } from './niveau/niveau.service';
import { LotController } from './lot/lot.controller';
import { LotService } from './lot/lot.service';

// Module Patrimoine : Copropriété → Bâtiment → Niveau → Lot.
// PrismaService est fourni globalement par PrismaModule.
@Module({
  controllers: [
    CoproprieteController,
    BatimentController,
    NiveauController,
    LotController,
  ],
  providers: [
    CoproprieteService,
    BatimentService,
    NiveauService,
    LotService,
  ],
  exports: [CoproprieteService, BatimentService, NiveauService, LotService],
})
export class PatrimoineModule {}
