import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { AppelService } from './appel.service';
import { CreateAppelDto } from './dto/create-appel.dto';

@Controller()
export class AppelController {
  constructor(private readonly service: AppelService) {}

  @Post('coproprietes/:coproprieteId/appels')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateAppelDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/appels')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Get('appels/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get('appels/:id/releve/:personneId')
  releve(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('personneId', ParseUUIDPipe) personneId: string,
  ) {
    return this.service.releve(id, personneId);
  }

  @Patch('appels/:id/valider')
  valider(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.valider(id);
  }

  @Patch('appels/:id/annuler')
  annuler(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.annuler(id);
  }
}
