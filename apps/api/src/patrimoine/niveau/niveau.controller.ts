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
import { Roles } from '../../auth/decorators';
import { NiveauService } from './niveau.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';

@Controller()
export class NiveauController {
  constructor(private readonly service: NiveauService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post('batiments/:batimentId/niveaux')
  create(
    @Param('batimentId', ParseUUIDPipe) batimentId: string,
    @Body() dto: CreateNiveauDto,
  ) {
    return this.service.create(batimentId, dto);
  }

  @Get('batiments/:batimentId/niveaux')
  findAll(@Param('batimentId', ParseUUIDPipe) batimentId: string) {
    return this.service.findAll(batimentId);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('niveaux/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNiveauDto) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('niveaux/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
