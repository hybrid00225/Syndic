import { Module } from '@nestjs/common';
import { PatrimoineModule } from '../patrimoine/patrimoine.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { StockageService } from './stockage.service';

// Documents téléversés (PDF, images) + stockage fichier (local pour le MVP).
@Module({
  imports: [PatrimoineModule],
  controllers: [DocumentController],
  providers: [DocumentService, StockageService],
  exports: [DocumentService, StockageService],
})
export class DocumentsModule {}
