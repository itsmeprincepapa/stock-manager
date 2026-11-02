import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// DTO utilisé quand le gérant MODIFIE un compte.
// Reprend les champs de CreateUserDto (nom, email, mot de passe, rôle) en les rendant
// tous facultatifs : on peut ne changer que le nom, ou seulement le mot de passe.
// Les règles de validation restent actives pour les champs envoyés.
export class UpdateUserDto extends PartialType(CreateUserDto) {}