import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { Roles } from '../../auth/decorators';
import { DetentionService } from './detention.service';
import { CreateDetentionDto } from './dto/create-detention.dto';
import { UpdateDetentionDto } from './dto/update-detention.dto';

@Controller()
export class DetentionController {
  constructor(private readonly service: DetentionService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post('lots/:lotId/detentions')
  create(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Body() dto: CreateDetentionDto,
  ) {
    return this.service.create(lotId, dto);
  }

  @Get('lots/:lotId/detentions')
  findByLot(
    @Param('lotId', ParseUUIDPipe) lotId: string,
    @Query('actives', new ParseBoolPipe({ optional: true }))
    actives?: boolean,
  ) {
    return this.service.findByLot(lotId, actives ?? false);
  }

  @Get('personnes/:id/detentions')
  findByPersonne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findByPersonne(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('detentions/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDetentionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('detentions/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}

