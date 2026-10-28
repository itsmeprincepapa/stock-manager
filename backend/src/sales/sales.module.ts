import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './sale.entity';
import { SaleItem } from './sale-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem])],
})
export class SalesModule {}