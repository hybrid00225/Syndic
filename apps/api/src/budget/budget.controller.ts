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
import { RoleType } from '@prisma/client';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { Roles } from '../auth/decorators';

@Controller()
export class BudgetController {
  constructor(private readonly service: BudgetService) {}

  @Roles(RoleType.GESTIONNAIRE)
  @Post('coproprietes/:coproprieteId/budgets')
  create(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.service.create(coproprieteId, dto);
  }

  @Get('coproprietes/:coproprieteId/budgets')
  findAll(
    @Param('coproprieteId', ParseUUIDPipe) coproprieteId: string,
    @Query('exerciceId') exerciceId?: string,
  ) {
    return this.service.findAll(coproprieteId, exerciceId);
  }

  @Get('budgets/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get('budgets/:id/ecarts')
  ecarts(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.ecarts(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('budgets/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateBudgetDto) {
    return this.service.update(id, dto);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('budgets/:id/soumettre')
  soumettre(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.soumettre(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('budgets/:id/approuver')
  approuver(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.approuver(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Patch('budgets/:id/rejeter')
  rejeter(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.rejeter(id);
  }

  @Roles(RoleType.GESTIONNAIRE)
  @Post('budgets/:id/reviser')
  reviser(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.reviser(id);
  }
}
