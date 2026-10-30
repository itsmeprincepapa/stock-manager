import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// DTO utilisé quand on MODIFIE un produit.
// 1. OmitType retire le champ "quantity" : le stock ne se modifie plus ici,
//    seulement par les mouvements de stock et les ventes (l'historique reste fiable).
// 2. PartialType rend tous les champs restants facultatifs :
//    on peut ne changer que le prix, ou que le nom.
// Les règles de validation restent actives pour les champs envoyés.
export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['quantity'] as const),
) {}