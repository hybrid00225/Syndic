import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser, Public } from './decorators';
import { AuthUser } from './auth-user.interface';

const MINUTE = 60_000;

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  // Anti-abus : 5 inscriptions par heure et par IP.
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60 * MINUTE } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.service.register(dto);
  }

  // Anti-force brute : 5 tentatives par minute et par IP (puis 429).
  @Public()
  @Throttle({ default: { limit: 5, ttl: MINUTE } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.service.me(user.userId);
  }
}
