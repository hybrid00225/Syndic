import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { PatrimoineModule } from './patrimoine/patrimoine.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    PatrimoineModule,
    // Les prochains modules métier seront ajoutés ici, un par un.
  ],
  controllers: [AppController],
})
export class AppModule {}
