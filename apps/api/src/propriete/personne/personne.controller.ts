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
import { PersonneService } from './personne.service';
import { CreatePersonneDto } from './dto/create-personne.dto';
import { UpdatePersonneDto } from './dto/update-personne.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('personnes')
export class PersonneController {
  constructor(private readonly service: PersonneService) {}

  @Post()
  create(@Body() dto: CreatePersonneDto) {
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
    @Body() dto: UpdatePersonneDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post(':id/contacts')
  addContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.service.addContact(id, dto);
  }
}
