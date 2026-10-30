import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Paramètres de pagination envoyés dans l'URL : /sales?page=2&limit=20
// Les autres DTO de requête (produits, historique) pourront en hériter.
export class PaginationQueryDto {
  // Numéro de la page demandée : 1 par défaut
  // @Type(() => Number) : les paramètres d'URL arrivent en TEXTE ("2"),
  // on les convertit en nombre avant de les valider.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un nombre entier.' })
  @Min(1, { message: 'La page doit être au moins 1.' })
  page: number = 1;

  // Nombre d'éléments par page : 20 par défaut, 100 au maximum.
  // Le plafond empêche de demander toute la base d'un coup.
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier.' })
  @Min(1, { message: 'La limite doit être au moins 1.' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100.' })
  limit: number = 20;
}