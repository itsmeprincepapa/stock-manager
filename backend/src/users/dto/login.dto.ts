import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// DTO utilisé pour se connecter.
export class LoginDto {
  // Email saisi
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email: string;

  // Mot de passe saisi.
  // Ici, on ne vérifie pas la longueur : on se contente de vérifier qu'il est présent.
  // C'est le service qui le comparera au mot de passe haché de la base.
  @IsString({ message: 'Le mot de passe doit être du texte.' })
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  password: string;
}