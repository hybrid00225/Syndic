import { Module } from '@nestjs/common';
import { PatrimoineModule } from '../patrimoine/patrimoine.module';
import { CleController } from './cle/cle.controller';
import { CleService } from './cle/cle.service';
import { VersionController } from './version/version.controller';
import { VersionService } from './version/version.service';

// Module 03 — Clés de répartition & tantièmes (versionnés).
// Importe PatrimoineModule pour réutiliser CoproprieteService (RG-17).
@Module({
  imports: [PatrimoineModule],
  controllers: [CleController, VersionController],
  providers: [CleService, VersionService],
  exports: [CleService, VersionService],
})
export class TantiemesModule {}
