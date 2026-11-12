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
import { ReglementService } from './reglement.service';
import { CreateReglementDto } from './dto/create-reglement.dto';
import { UpdateReglementDto } from './dto/update-reglement.dto';
import { Roles } from '../../auth/decorators';

@Controller()
export class ReglementController {
  constructor(private readonly service: ReglementService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/reglement-versions')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateReglementDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/reglement-versions')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('reglement-versions/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReglementDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('reglement-versions/:id/courant')
  definirCourante(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.definirCourante(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('reglement-versions/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
