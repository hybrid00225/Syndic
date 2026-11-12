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
import { PersonneService } from './personne.service';
import { CreatePersonneDto } from './dto/create-personne.dto';
import { UpdatePersonneDto } from './dto/update-personne.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CurrentUser, Roles } from '../../auth/decorators';
import { AuthUser } from '../../auth/auth-user.interface';

@Controller('personnes')
export class PersonneController {
  constructor(private readonly service: PersonneService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePersonneDto) {
    return this.service.create(dto, user.syndicId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.syndicId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePersonneDto,
  ) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post(':id/contacts')
  addContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.service.addContact(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
