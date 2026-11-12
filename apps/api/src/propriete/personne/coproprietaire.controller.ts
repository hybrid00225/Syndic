import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { PersonneService } from './personne.service';

// Copropriétaires vus depuis UNE copropriété (règle 3 : relation M:N).
@Controller()
export class CoproprietaireController {
  constructor(private readonly service: PersonneService) {}

  @Get('coproprietes/:coproprieteId/coproprietaires')
  findAll(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Query('historique') historique?: string,
  ) {
    return this.service.coproprietairesDeCopropriete(
      coproprieteId,
      historique === 'true',
    );
  }
}
