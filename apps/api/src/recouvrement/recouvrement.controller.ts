import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RecouvrementService } from './recouvrement.service';
import { CreateRelanceDto } from './dto/create-relance.dto';

@Controller('coproprietes/:coproprieteId')
export class RecouvrementController {
  constructor(private readonly service: RecouvrementService) {}

  @Get('impayes')
  impayes(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Query('personneId') personneId?: string,
  ) {
    return this.service.impayes(coproprieteId, personneId);
  }

  @Get('personnes/:personneId/situation')
  situation(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Param('personneId', ParseUUIDPipe) personneId: string,
  ) {
    return this.service.situation(coproprieteId, personneId);
  }

  @Post('personnes/:personneId/relances')
  creerRelance(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Param('personneId', ParseUUIDPipe) personneId: string,
    @Body() dto: CreateRelanceDto,
  ) {
    return this.service.creerRelance(coproprieteId, personneId, dto);
  }

  @Get('personnes/:personneId/relances')
  relances(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Param('personneId', ParseUUIDPipe) personneId: string,
  ) {
    return this.service.relances(coproprieteId, personneId);
  }
}
