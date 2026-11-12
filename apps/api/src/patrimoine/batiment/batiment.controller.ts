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
import { BatimentService } from './batiment.service';
import { CreateBatimentDto } from './dto/create-batiment.dto';
import { UpdateBatimentDto } from './dto/update-batiment.dto';
import { CurrentUser, Roles } from '../../auth/decorators';
import {
  AuthUser,
  perimetreCoproprietes,
} from '../../auth/auth-user.interface';

@Controller()
export class BatimentController {
  constructor(private readonly service: BatimentService) {}

  // Vue globale (tous les bâtiments du syndic).
  @Get('batiments')
  findAllGlobal(
    @CurrentUser() user: AuthUser,
    @Query('coproprieteId') coproprieteId?: string,
  ) {
    return this.service.findAllBySyndic(
      user.syndicId,
      coproprieteId,
      perimetreCoproprietes(user),
    );
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/batiments')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateBatimentDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/batiments')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('batiments/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBatimentDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete('batiments/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
