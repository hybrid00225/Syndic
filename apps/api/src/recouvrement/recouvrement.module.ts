import { Module } from '@nestjs/common';
import { RecouvrementController } from './recouvrement.controller';
import { RecouvrementService } from './recouvrement.service';

// Module 06 — Impayés & recouvrement (soldes calculés + relances).
@Module({
  controllers: [RecouvrementController],
  providers: [RecouvrementService],
  exports: [RecouvrementService],
})
export class RecouvrementModule {}
