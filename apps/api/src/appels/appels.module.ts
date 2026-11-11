import { Module } from '@nestjs/common';
import { PatrimoineModule } from '../patrimoine/patrimoine.module';
import { AppelController } from './appel.controller';
import { AppelService } from './appel.service';

// Module 04 — Appels de fonds (génération depuis les tantièmes → contributions).
@Module({
  imports: [PatrimoineModule],
  controllers: [AppelController],
  providers: [AppelService],
  exports: [AppelService],
})
export class AppelsModule {}
