import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CoproprieteService } from './copropriete.service';
import { CreateCoproprieteDto } from './dto/create-copropriete.dto';
import { CreateCoproprieteCompleteDto } from './dto/create-copropriete-complete.dto';
import { UpdateCoproprieteDto } from './dto/update-copropriete.dto';
import { CurrentUser } from '../../auth/decorators';
import { AuthUser } from '../../auth/auth-user.interface';

@Controller('coproprietes')
export class CoproprieteController {
  constructor(private readonly service: CoproprieteService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCoproprieteDto) {
    return this.service.create(dto, user.syndicId);
  }

  // Création complète (copropriété + bâtiments/niveaux + lots) en une fois.
  @Post('complete')
  createComplete(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCoproprieteCompleteDto,
  ) {
    return this.service.createComplete(dto, user.syndicId);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.syndicId);
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
