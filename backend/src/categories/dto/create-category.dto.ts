import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// DTO utilisé quand on CRÉE une catégorie.
// Seul le "name" est demandé : l'id et la date sont générés par la base de données.
export class CreateCategoryDto {
  // Règle 1 : doit être du texte
  @IsString({ message: 'Le nom doit être du texte.' })
  // Règle 2 : ne doit pas être vide
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  // Règle 3 : 100 caractères maximum (comme dans l'entité Category)
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères.' })
  name: string;
}