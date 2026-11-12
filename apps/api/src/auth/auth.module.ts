import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TenantGuard } from './guards/tenant.guard';
import { RolesGuard } from './guards/roles.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

// Les gardes sont enregistrées ici (APP_GUARD = globales), dans cet ordre :
// Throttler (avant toute requête en base) → JWT → Tenant → Roles.
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Secret validé au démarrage (config/env.ts). Algorithme imposé : HS256.
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.get<string>('JWT_EXPIRES_IN') || '12h',
        },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
