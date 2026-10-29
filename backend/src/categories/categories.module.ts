import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';

@Module({
  // Rend le repository de Category disponible dans ce module
  imports: [TypeOrmModule.forFeature([Category])],
  // Les contrôleurs de ce module (les routes)
  controllers: [CategoriesController],
  // Les services de ce module (la logique)
  providers: [CategoriesService],
  // Permet aux autres modules (comme Products) d'utiliser CategoriesService
  exports: [CategoriesService],
})
export class CategoriesModule {}