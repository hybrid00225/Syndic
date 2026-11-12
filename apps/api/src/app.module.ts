import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validerEnv } from './config/env';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { PatrimoineModule } from './patrimoine/patrimoine.module';
import { ProprieteModule } from './propriete/propriete.module';
import { TantiemesModule } from './tantiemes/tantiemes.module';
import { AppelsModule } from './appels/appels.module';
import { EncaissementsModule } from './encaissements/encaissements.module';
import { RecouvrementModule } from './recouvrement/recouvrement.module';
import { BudgetModule } from './budget/budget.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validerEnv }),
    // Limitation de débit globale par IP (ajustée par @Throttle sur /auth).
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 600 }],
      errorMessage: 'Trop de requêtes : réessayez dans quelques instants',
    }),
    PrismaModule,
    AuthModule,
    AuditModule,
    PatrimoineModule,
    ProprieteModule,
    TantiemesModule,
    AppelsModule,
    EncaissementsModule,
    RecouvrementModule,
    BudgetModule,
    DocumentsModule,
    // Les prochains modules métier seront ajoutés ici, un par un.
  ],
  controllers: [AppController],
})
export class AppModule {}
