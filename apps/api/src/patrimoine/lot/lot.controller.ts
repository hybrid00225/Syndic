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
import { LotService } from './lot.service';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { QueryLotDto } from './dto/query-lot.dto';
import { CurrentUser } from '../../auth/decorators';
import { AuthUser } from '../../auth/auth-user.interface';

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
    return this.service.findAllBySyndic(user.syndicId, {
      coproprieteId,
      type,
      statut,
      batimentId,
    });
  }

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

  @Patch('lots/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLotDto) {
    return this.service.update(id, dto);
  }

  @Delete('lots/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
