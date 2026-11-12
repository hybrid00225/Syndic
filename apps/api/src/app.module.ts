import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    ConfigModule.forRoot({ isGlobal: true }),
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
