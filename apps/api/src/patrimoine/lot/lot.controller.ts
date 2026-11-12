import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { LotService } from './lot.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { QueryLotDto } from './dto/query-lot.dto';
import {
  AnnexerLotDto,
  ChangerDestinationDto,
  FusionLotDto,
  SubdivisionLotDto,
} from './dto/operations-lot.dto';
import { CurrentUser, Roles } from '../../auth/decorators';
import {
  AuthUser,
  perimetreCoproprietes,
} from '../../auth/auth-user.interface';

@Controller()
export class LotController {
  constructor(private readonly service: LotService) {}

  // Vue globale (tous les lots du syndic).
  @Get('lots')
  findAllGlobal(
    @CurrentUser() user: AuthUser,
    @Query('coproprieteId') coproprieteId?: string,
    @Query('type') type?: string,
    @Query('statut') statut?: string,
    @Query('batimentId') batimentId?: string,
  ) {
    return this.service.findAllBySyndic(
      user.syndicId,
      { coproprieteId, type, statut, batimentId },
      perimetreCoproprietes(user),
    );
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/lots')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateLotDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/lots')
  findAll(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Query() query: QueryLotDto,
  ) {
    return this.service.findAll(coproprieteId, query);
  }

  @Get('lots/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('lots/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLotDto) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('lots/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  // --- Opérations sur lots (domaine 2.11 à 2.15) --------------------------

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('lots/:id/annexer')
  annexer(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AnnexerLotDto) {
    return this.service.annexer(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('lots/:id/detacher')
  detacher(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detacher(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('lots/:id/destination')
  changerDestination(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangerDestinationDto,
  ) {
    return this.service.changerDestination(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/lots/fusion')
  fusionner(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: FusionLotDto,
  ) {
    return this.service.fusionner(coproprieteId, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post('lots/:id/subdivision')
  subdiviser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubdivisionLotDto,
  ) {
    return this.service.subdiviser(id, dto);
  }
}
