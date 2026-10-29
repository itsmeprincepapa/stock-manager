import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementsService } from './stock-movements.service';

// Toutes les routes de ce contrôleur commencent par /stock-movements
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  // POST /stock-movements : enregistrer un mouvement (entrée, sortie ou ajustement)
  @Post()
  create(@Body() dto: CreateStockMovementDto) {
    return this.stockMovementsService.create(dto);
  }

  // GET /stock-movements : voir l'historique.
  // Paramètre facultatif : /stock-movements?productId=1 pour un seul produit.
  // "optional: true" : si productId n'est pas envoyé, on ne renvoie pas d'erreur.
  @Get()
  findAll(
    @Query('productId', new ParseIntPipe({ optional: true }))
    productId?: number,
  ) {
    return this.stockMovementsService.findAll(productId);
  }
}