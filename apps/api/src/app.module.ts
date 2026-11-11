import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Les modules métier seront ajoutés ici, un par un (Patrimoine, …).
  ],
  controllers: [AppController],
})
export class AppModule {}
