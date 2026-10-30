import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// Paramètres acceptés par GET /products : page, limit (hérités) et search.
// "extends" reprend tout PaginationQueryDto, on n'ajoute que ce qui est propre aux produits.
export class ProductsQueryDto extends PaginationQueryDto {
  // Texte recherché dans le nom du produit (facultatif, 100 caractères maximum)
  @IsOptional()
  @IsString({ message: 'La recherche doit être du texte.' })
  @MaxLength(100, { message: 'La recherche ne doit pas dépasser 100 caractères.' })
  search?: string;
}