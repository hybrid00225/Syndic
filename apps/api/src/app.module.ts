import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { PatrimoineModule } from './patrimoine/patrimoine.module';
import { ProprieteModule } from './propriete/propriete.module';
import { TantiemesModule } from './tantiemes/tantiemes.module';
import { AppelsModule } from './appels/appels.module';
import { EncaissementsModule } from './encaissements/encaissements.module';
import { RecouvrementModule } from './recouvrement/recouvrement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PatrimoineModule,
    ProprieteModule,
    TantiemesModule,
    AppelsModule,
    EncaissementsModule,
    RecouvrementModule,
    // Les prochains modules métier seront ajoutés ici, un par un.
  ],
  controllers: [AppController],
})
export class AppModule {}
