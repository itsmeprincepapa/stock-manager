import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

// DTO utilisé quand on MODIFIE une catégorie.
// PartialType reprend tous les champs de CreateCategoryDto en les rendant facultatifs :
// on peut n'envoyer que ce qu'on veut changer.
// Les règles de validation restent actives pour les champs qui sont envoyés.
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}