import { IsInt, Min } from 'class-validator';

// Décrit UNE ligne du panier : un produit et la quantité voulue.
export class CreateSaleItemDto {
  // Id du produit vendu
  @IsInt({ message: "L'identifiant du produit doit être un nombre entier." })
  @Min(1, { message: "L'identifiant du produit est invalide." })
  productId: number;

  // Quantité vendue : au moins 1
  @IsInt({ message: 'La quantité doit être un nombre entier.' })
  @Min(1, { message: 'La quantité doit être d’au moins 1.' })
  quantity: number;
}