import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// DTO utilisé pour créer le premier compte (gérant).
// Le rôle n'est PAS demandé : le serveur le décide lui-même.
// Sinon, n'importe qui pourrait s'attribuer le rôle de gérant en l'envoyant.
export class RegisterDto {
  // Nom de l'utilisateur : texte obligatoire, 100 caractères maximum
  @IsString({ message: 'Le nom doit être du texte.' })
  @IsNotEmpty({ message: 'Le nom est obligatoire.' })
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères.' })
  name: string;

  // Email : doit avoir un format d'adresse email valide
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  @MaxLength(150, { message: "L'email ne doit pas dépasser 150 caractères." })
  email: string;

  // Mot de passe : au moins 8 caractères.
  // Maximum 72 : bcrypt ne tient compte que des 72 premiers caractères.
  @IsString({ message: 'Le mot de passe doit être du texte.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  @MaxLength(72, {
    message: 'Le mot de passe ne doit pas dépasser 72 caractères.',
  })
  password: string;
}