import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CurrentUser } from './decorators';
import { AuthUser } from './auth-user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    if (!user.adminSyndic) {
      throw new ForbiddenException("Réservé à l'administrateur du syndic");
    }
    return this.service.create(user.syndicId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    if (!user.adminSyndic) {
      throw new ForbiddenException("Réservé à l'administrateur du syndic");
    }
    return this.service.findAll(user.syndicId);
  }
}
