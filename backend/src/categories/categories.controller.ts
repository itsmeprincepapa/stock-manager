import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Toutes les routes de ce contrôleur commencent par /categories
@Controller('categories')
export class CategoriesController {
  // NestJS nous fournit le service automatiquement (injection de dépendance)
  constructor(private readonly categoriesService: CategoriesService) {}

  // POST /categories : créer une catégorie.
  // @Body() récupère le JSON envoyé, et le valide avec CreateCategoryDto.
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // GET /categories : lister toutes les catégories
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // GET /categories/:id : voir une catégorie.
  // @Param('id') récupère l'id dans l'URL (ex. /categories/3),
  // ParseIntPipe le convertit en nombre et refuse si ce n'est pas un nombre.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  // PATCH /categories/:id : modifier une catégorie (seulement les champs envoyés)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  // DELETE /categories/:id : supprimer une catégorie
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}