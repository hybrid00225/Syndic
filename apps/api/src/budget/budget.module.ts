import { Module } from '@nestjs/common';
import { PatrimoineModule } from '../patrimoine/patrimoine.module';
import { ExerciceController } from './exercice.controller';
import { ExerciceService } from './exercice.service';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';

// Domaines 8 (budgets prévisionnels) & 25 (exercices comptables, clôtures).
@Module({
  imports: [PatrimoineModule],
  controllers: [ExerciceController, BudgetController],
  providers: [ExerciceService, BudgetService],
  exports: [ExerciceService, BudgetService],
})
export class BudgetModule {}
