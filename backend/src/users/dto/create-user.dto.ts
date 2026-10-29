import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../user.entity';

// DTO utilisé par le GÉRANT pour créer le compte d'un employé.
// Contrairement à RegisterDto, il contient un champ "role" :
// c'est acceptable ici, car seul un gérant connecté peut utiliser cette route.
export class CreateUserDto {
  // Nom de l'employé : texte obligatoire, 100 caractères maximum
  @IsString({ message: 'Le nom doit être du texte.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères.' })
  name: string;

  // Email : doit avoir un format valide
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  @MaxLength(150, { message: "L'email ne doit pas dépasser 150 caractères." })
  email: string;

  // Mot de passe initial : 8 caractères minimum, 72 maximum (limite de bcrypt)
  @IsString({ message: 'Le mot de passe doit être du texte.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(72, {
    message: 'Le mot de passe ne doit pas dépasser 72 caractères.',
  })
  password: string;

  // Rôle facultatif : MANAGER ou SELLER. S'il est absent, le service mettra SELLER.
  @IsOptional()
  @IsEnum(Role, { message: 'Le rôle doit être MANAGER ou SELLER.' })
  role?: Role;
}