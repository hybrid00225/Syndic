import { Module } from '@nestjs/common';
import { CoproprieteController } from './copropriete/copropriete.controller';
import { CoproprieteService } from './copropriete/copropriete.service';
import { BatimentController } from './batiment/batiment.controller';
import { BatimentService } from './batiment/batiment.service';
import { NiveauController } from './niveau/niveau.controller';
import { NiveauService } from './niveau/niveau.service';
import { LotController } from './lot/lot.controller';
import { LotService } from './lot/lot.service';
import { PartieCommuneController } from './partie-commune/partie-commune.controller';
import { PartieCommuneService } from './partie-commune/partie-commune.service';
import { EquipementController } from './equipement/equipement.controller';
import { EquipementService } from './equipement/equipement.service';
import { AccesController } from './acces/acces.controller';
import { AccesService } from './acces/acces.service';
import { ReglementController } from './reglement/reglement.controller';
import { ReglementService } from './reglement/reglement.service';

// Module Patrimoine : Copropriété → Bâtiment → Niveau → Lot,
// + inventaire technique (parties communes, équipements).
// PrismaService est fourni globalement par PrismaModule.
@Module({
  controllers: [
    CoproprieteController,
    BatimentController,
    NiveauController,
    LotController,
    PartieCommuneController,
    EquipementController,
    AccesController,
    ReglementController,
  ],
  providers: [
    CoproprieteService,
    BatimentService,
    NiveauService,
    LotService,
    PartieCommuneService,
    EquipementService,
    AccesService,
    ReglementService,
  ],
  exports: [
    CoproprieteService,
    BatimentService,
    NiveauService,
    LotService,
    PartieCommuneService,
    EquipementService,
    AccesService,
    ReglementService,
  ],
})
export class PatrimoineModule {}
