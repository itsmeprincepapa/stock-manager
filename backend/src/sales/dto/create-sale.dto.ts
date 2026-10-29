import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { CreateSaleItemDto } from './create-sale-item.dto';

// Décrit le panier envoyé pour enregistrer une vente.
export class CreateSaleDto {
  // "items" doit être un tableau, et il ne peut pas être vide
  @IsArray({ message: 'Les articles doivent être envoyés sous forme de liste.' })
  @ArrayNotEmpty({ message: 'Une vente doit contenir au moins un article.' })
  // Valide chaque élément du tableau avec les règles de CreateSaleItemDto
  @ValidateNested({ each: true })
  // Indique à class-transformer de transformer chaque élément en CreateSaleItemDto.
  // Sans cette ligne, les règles de validation des lignes ne s'appliqueraient pas.
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];
}