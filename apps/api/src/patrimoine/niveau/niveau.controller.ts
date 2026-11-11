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
import { NiveauService } from './niveau.service';
import { CreateNiveauDto } from './dto/create-niveau.dto';
import { UpdateNiveauDto } from './dto/update-niveau.dto';

@Controller()
export class NiveauController {
  constructor(private readonly service: NiveauService) {}

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

  @Patch('niveaux/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNiveauDto) {
    return this.service.update(id, dto);
  }

  @Delete('niveaux/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
