import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../users/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

// Toutes les routes de ce contrôleur commencent par /sales
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // POST /sales : enregistrer une vente à partir d'un panier (gérant et vendeur)
  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

    // GET /sales : lister les ventes, paginées (?page=1&limit=20)
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.salesService.findAll(query);
  }

  // GET /sales/:id : voir une vente avec ses lignes
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }

  // POST /sales/:id/cancel : annuler une vente (gérant seulement).
  // Un vendeur ne peut pas annuler : c'est une action sensible, qui touche aux chiffres.
  // On répond 200 (et non 201), car on ne crée aucune ressource : on modifie une vente existante.
  @Roles(Role.MANAGER)
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.cancel(id);
  }
}