import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementType } from '../stock-movement.entity';

// DTO utilisé quand on ENREGISTRE un mouvement de stock.
export class CreateStockMovementDto {
  // Id du produit concerné (on enverra par exemple 1, pas l'objet produit)
  @IsInt({ message: "L'identifiant du produit doit être un nombre entier." })
  @Min(1, { message: "L'identifiant du produit est invalide." })
  productId: number;

  // Type du mouvement : doit être exactement IN, OUT ou ADJUSTMENT
  @IsEnum(MovementType, {
    message: 'Le type doit être IN (entrée), OUT (sortie) ou ADJUSTMENT (ajustement).',
  })
  type: MovementType;

  // Quantité : entier positif ou nul.
  // Pour IN et OUT, le service exigera au moins 1.
  // Pour ADJUSTMENT, 0 est permis (ex. inventaire : il n'en reste plus du tout).
  @IsInt({ message: 'La quantité doit être un nombre entier.' })
  @Min(0, { message: 'La quantité ne peut pas être négative.' })
  quantity: number;

  // Motif facultatif (ex. "livraison fournisseur", "produit cassé")
  @IsOptional()
  @IsString({ message: 'Le motif doit être du texte.' })
  @IsNotEmpty({ message: 'Le motif ne peut pas être vide.' })
  @MaxLength(255, { message: 'Le motif ne doit pas dépasser 255 caractères.' })
  reason?: string;
}