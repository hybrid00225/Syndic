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
import { CoproprieteService } from './copropriete.service';
import { CreateCoproprieteDto } from './dto/create-copropriete.dto';
import { UpdateCoproprieteDto } from './dto/update-copropriete.dto';

@Controller('coproprietes')
export class CoproprieteController {
  constructor(private readonly service: CoproprieteService) {}

  @Post()
  create(@Body() dto: CreateCoproprieteDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('syndicId') syndicId?: string) {
    return this.service.findAll(syndicId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoproprieteDto,
  ) {
    return this.service.update(id, dto);
  }
}
