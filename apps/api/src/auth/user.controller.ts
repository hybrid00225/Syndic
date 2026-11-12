import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminSyndic, CurrentUser } from './decorators';
import { AuthUser } from './auth-user.interface';

// Gestion des utilisateurs : réservée à l'administrateur du syndic.
@AdminSyndic()
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.service.create(user.syndicId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.service.findAll(user.syndicId);
  }
}
