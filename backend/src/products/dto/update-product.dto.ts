import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// DTO utilisé quand on MODIFIE un produit.
// Reprend tous les champs de CreateProductDto en les rendant facultatifs :
// on peut ne changer que le prix, ou que la quantité, par exemple.
// Les règles de validation restent actives pour les champs envoyés.
export class UpdateProductDto extends PartialType(CreateProductDto) {}