import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { VersionService } from './version.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Controller('cles/:cleId/versions')
export class VersionController {
  constructor(private readonly service: VersionService) {}

  @Post()
  create(
    @Param('cleId', ParseUUIDPipe) cleId: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.service.create(cleId, dto);
  }

  // Corrige la version courante sur place (tant qu'elle n'a pas servi).
  @Patch('courante')
  corrigerCourante(
    @Param('cleId', ParseUUIDPipe) cleId: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.service.corrigerCourante(cleId, dto);
  }

  @Get()
  findByCle(@Param('cleId', ParseUUIDPipe) cleId: string) {
    return this.service.findByCle(cleId);
  }

  @Get('applicable')
  applicable(
    @Param('cleId', ParseUUIDPipe) cleId: string,
    @Query('date') date: string,
  ) {
    return this.service.applicableAt(cleId, date);
  }
}
