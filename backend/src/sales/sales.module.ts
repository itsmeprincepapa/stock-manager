import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleItem } from './sale-item.entity';
import { Sale } from './sale.entity';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  // Rend les repositories de Sale et SaleItem disponibles dans ce module
  imports: [TypeOrmModule.forFeature([Sale, SaleItem])],
  // Les routes de ce module
  controllers: [SalesController],
  // La logique de ce module
  providers: [SalesService],
})
export class SalesModule {}