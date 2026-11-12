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
import { EquipementService } from './equipement.service';
import { CreateEquipementDto } from './dto/create-equipement.dto';
import { UpdateEquipementDto } from './dto/update-equipement.dto';
import { QueryEquipementDto } from './dto/query-equipement.dto';
import { ChangerEtatDto } from './dto/changer-etat.dto';
import { CurrentUser, Roles } from '../../auth/decorators';
import { AuthUser } from '../../auth/auth-user.interface';

@Controller()
export class EquipementController {
  constructor(private readonly service: EquipementService) {}

  // Vue globale (tous les équipements du syndic, filtrable).
  @Get('equipements')
  findAllGlobal(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryEquipementDto,
  ) {
    return this.service.findAllBySyndic(user.syndicId, query);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/equipements')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateEquipementDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/equipements')
  findAll(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Query() query: QueryEquipementDto,
  ) {
    return this.service.findAll(coproprieteId, query);
  }

  @Get('coproprietes/:coproprieteId/equipements/statistiques')
  statistiques(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.statistiques(coproprieteId);
  }

  @Get('equipements/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('equipements/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipementDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('equipements/:id/etat')
  changerEtat(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangerEtatDto,
  ) {
    return this.service.changerEtat(id, dto.etat);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('equipements/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
