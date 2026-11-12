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
import { PartieCommuneService } from './partie-commune.service';
import { CreatePartieCommuneDto } from './dto/create-partie-commune.dto';
import { UpdatePartieCommuneDto } from './dto/update-partie-commune.dto';
import { Roles } from '../../auth/decorators';

@Controller()
export class PartieCommuneController {
  constructor(private readonly service: PartieCommuneService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/parties-communes')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreatePartieCommuneDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/parties-communes')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('parties-communes/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePartieCommuneDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('parties-communes/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
