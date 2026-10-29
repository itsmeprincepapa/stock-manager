import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

// Toutes les routes de ce contrôleur commencent par /sales
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // POST /sales : enregistrer une vente à partir d'un panier
  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  // GET /sales : lister les ventes (les plus récentes d'abord)
  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  // GET /sales/:id : voir une vente avec ses lignes
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }
}