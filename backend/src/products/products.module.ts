import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';

@Module({
  imports: [
    // Rend le repository de Product disponible dans ce module
    TypeOrmModule.forFeature([Product]),
    // Permet d'utiliser CategoriesService (exporté par CategoriesModule)
    CategoriesModule,
  ],
  // Les routes de ce module
  controllers: [ProductsController],
  // La logique de ce module
  providers: [ProductsService],
  // Les ventes et le stock auront besoin de ProductsService plus tard
  exports: [ProductsService],
})
export class ProductsModule {}