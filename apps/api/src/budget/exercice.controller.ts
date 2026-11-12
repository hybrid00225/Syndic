import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { ExerciceService } from './exercice.service';
import { CreateExerciceDto } from './dto/create-exercice.dto';
import { UpdateExerciceDto } from './dto/update-exercice.dto';
import { Roles } from '../auth/decorators';

@Controller()
export class ExerciceController {
  constructor(private readonly service: ExerciceService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/exercices')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateExerciceDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/exercices')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Get('exercices/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('exercices/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExerciceDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('exercices/:id/demarrer-cloture')
  demarrerCloture(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.demarrerCloture(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('exercices/:id/rouvrir')
  rouvrir(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.rouvrir(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('exercices/:id/cloturer')
  cloturer(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cloturer(id);
  }
}
