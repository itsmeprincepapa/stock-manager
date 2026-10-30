import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../users/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsQueryDto } from './dto/products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

// Toutes les routes de ce contrôleur commencent par /products
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // POST /products : créer un produit (gérant seulement)
  @Roles(Role.MANAGER)
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // GET /products : lister les produits, paginés.
  // @Query() sans nom récupère TOUS les paramètres d'URL et les valide avec ProductsQueryDto
  // (page, limit, search). Un paramètre inconnu est refusé.
  @Get()
  findAll(@Query() query: ProductsQueryDto) {
    return this.productsService.findAll(query);
  }

  // GET /products/low-stock : produits dont le stock est faible.
  // Cette route doit rester AVANT "GET /products/:id".
  @Get('low-stock')
  findLowStock() {
    return this.productsService.findLowStock();
  }

  // GET /products/:id : voir un produit
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // PATCH /products/:id : modifier un produit (gérant seulement)
  @Roles(Role.MANAGER)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  // DELETE /products/:id : supprimer un produit (gérant seulement)
  @Roles(Role.MANAGER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}