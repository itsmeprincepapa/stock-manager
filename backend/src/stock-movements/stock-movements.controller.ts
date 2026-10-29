import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/decorator/roles.decorator';
import { Role } from '../users/user.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
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

  // GET /stock-movements : voir l'historique (tout utilisateur connecté).
  // Paramètre facultatif : /stock-movements?productId=1
  @Get()
  findAll(
    @Query('productId', new ParseIntPipe({ optional: true }))
    productId?: number,
  ) {
    return this.stockMovementsService.findAll(productId);
  }
}