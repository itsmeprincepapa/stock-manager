import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// DTO utilisé quand on CRÉE un produit.
// L'id et les dates sont générés par la base : on ne les demande pas.
export class CreateProductDto {
  // Nom du produit : texte obligatoire, 150 caractères maximum
  @IsString({ message: 'Le nom doit être du texte.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  @MaxLength(150, { message: 'Le nom ne doit pas dépasser 150 caractères.' })
  name: string;

  // Prix : nombre positif ou nul, avec 2 décimales maximum
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Le prix doit être un nombre avec 2 décimales maximum.' },
  )
  @Min(0, { message: 'Le prix ne peut pas être négatif.' })
  price: number;

  // Quantité initiale en stock : entier positif ou nul.
  // @IsOptional : si le champ n'est pas envoyé, la base utilise sa valeur par défaut (0).
  @IsOptional()
  @IsInt({ message: 'La quantité doit être un nombre entier.' })
  @Min(0, { message: 'La quantité ne peut pas être négative.' })
  quantity?: number;

  // Seuil d'alerte : entier positif ou nul (5 par défaut si non envoyé)
  @IsOptional()
  @IsInt({ message: "Le seuil d'alerte doit être un nombre entier." })
  @Min(0, { message: "Le seuil d'alerte ne peut pas être négatif." })
  alertThreshold?: number;

  // Id de la catégorie du produit (facultatif).
  // On envoie l'id (ex. 3), pas l'objet catégorie complet : le service ira la chercher.
  @IsOptional()
  @IsInt({ message: "L'identifiant de la catégorie doit être un nombre entier." })
  categoryId?: number;
}