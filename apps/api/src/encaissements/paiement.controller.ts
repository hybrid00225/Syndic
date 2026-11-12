import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { CreateAffectationDto } from './dto/create-affectation.dto';
import { Roles } from '../auth/decorators';

@Controller()
export class PaiementController {
  constructor(private readonly service: PaiementService) {}

  @Roles(RoleType.CAISSIER, RoleType.COMPTABLE)
  @Post('coproprietes/:coproprieteId/paiements')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreatePaiementDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/paiements')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Get('paiements/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(RoleType.CAISSIER, RoleType.COMPTABLE)
  @Post('paiements/:paiementId/affectations')
  affecter(
    @Param('paiementId', ParseUUIDPipe) paiementId: string,
    @Body() dto: CreateAffectationDto,
  ) {
    return this.service.affecter(paiementId, dto);
  }

  @Roles(RoleType.CAISSIER, RoleType.COMPTABLE)
  @Delete('affectations/:id')
  desaffecter(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.desaffecter(id);
  }

  @Roles(RoleType.CAISSIER, RoleType.COMPTABLE)
  @Patch('paiements/:id/annuler')
  annuler(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.annuler(id);
  }
}
