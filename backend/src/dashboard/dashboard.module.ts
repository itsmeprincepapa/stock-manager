import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  // Les trois repositories dont le service a besoin
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Product])],
  // La route GET /dashboard
  controllers: [DashboardController],
  // La logique des statistiques
  providers: [DashboardService],
})
export class DashboardModule {}