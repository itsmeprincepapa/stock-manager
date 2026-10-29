import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { StockMovement } from './stock-movement.entity';

@Module({
  // Rend le repository de StockMovement disponible dans ce module
  imports: [TypeOrmModule.forFeature([StockMovement])],
  // Les routes de ce module
  controllers: [StockMovementsController],
  // La logique de ce module
  providers: [StockMovementsService],
})
export class StockMovementsModule {}