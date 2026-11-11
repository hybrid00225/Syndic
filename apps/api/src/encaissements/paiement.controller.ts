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
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { CreateAffectationDto } from './dto/create-affectation.dto';

@Controller()
export class PaiementController {
  constructor(private readonly service: PaiementService) {}

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

  @Post('paiements/:paiementId/affectations')
  affecter(
    @Param('paiementId', ParseUUIDPipe) paiementId: string,
    @Body() dto: CreateAffectationDto,
  ) {
    return this.service.affecter(paiementId, dto);
  }

  @Delete('affectations/:id')
  desaffecter(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.desaffecter(id);
  }

  @Patch('paiements/:id/annuler')
  annuler(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.annuler(id);
  }
}
