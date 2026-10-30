import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../users/user.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementsQueryDto } from './dto/stock-movements-query.dto';
import { StockMovementsService } from './stock-movements.service';

// Toutes les routes de ce contrôleur commencent par /stock-movements
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  // POST /stock-movements : enregistrer un mouvement (gérant seulement)
  @Roles(Role.MANAGER)
  @Post()
  create(@Body() dto: CreateStockMovementDto) {
    return this.stockMovementsService.create(dto);
  }

  // GET /stock-movements : voir l'historique, paginé (tout utilisateur connecté).
  // Paramètres : ?page=1&limit=20&productId=1 (tous facultatifs)
  @Get()
  findAll(@Query() query: StockMovementsQueryDto) {
    return this.stockMovementsService.findAll(query);
  }
}