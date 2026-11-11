import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CleService } from './cle.service';
import { CreateCleDto } from './dto/create-cle.dto';
import { UpdateCleDto } from './dto/update-cle.dto';

@Controller()
export class CleController {
  constructor(private readonly service: CleService) {}

  @Post('coproprietes/:coproprieteId/cles')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateCleDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/cles')
  findAll(@Param('coproprieteId', ParseUUIDPipe) coproprieteId: string) {
    return this.service.findAll(coproprieteId);
  }

  @Get('cles/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch('cles/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCleDto) {
    return this.service.update(id, dto);
  }
}
