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
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../users/user.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Toutes les routes de ce contrôleur commencent par /categories
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // POST /categories : créer une catégorie (gérant seulement)
  @Roles(Role.MANAGER)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  // GET /categories : lister les catégories (tout utilisateur connecté)
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // GET /categories/:id : voir une catégorie (tout utilisateur connecté)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.findOne(id);
  }

  // PATCH /categories/:id : modifier une catégorie (gérant seulement)
  @Roles(Role.MANAGER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  // DELETE /categories/:id : supprimer une catégorie (gérant seulement)
  @Roles(Role.MANAGER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}