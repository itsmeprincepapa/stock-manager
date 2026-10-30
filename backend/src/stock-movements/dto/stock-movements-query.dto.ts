import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// Paramètres acceptés par GET /stock-movements : page, limit (hérités) et productId.
export class StockMovementsQueryDto extends PaginationQueryDto {
  // Id du produit dont on veut l'historique (facultatif).
  // @Type(() => Number) : le paramètre d'URL arrive en texte, on le convertit en nombre.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "L'identifiant du produit doit être un nombre entier." })
  @Min(1, { message: "L'identifiant du produit est invalide." })
  productId?: number;
}