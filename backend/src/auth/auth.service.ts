import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role, User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from '../users/dto/login.dto';
import { RegisterDto } from '../users/dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    // Pour créer et retrouver des utilisateurs
    private readonly usersService: UsersService,
    // Pour fabriquer les tokens JWT (il sera configuré dans auth.module.ts)
    private readonly jwtService: JwtService,
  ) {}

  // INSCRIPTION : uniquement pour le tout premier compte.
  async register(dto: RegisterDto) {
    // Si au moins un utilisateur existe déjà, l'inscription publique est fermée
    const count = await this.usersService.count();
    if (count > 0) {
      throw new ForbiddenException(
        "L'inscription est fermée. Demandez au gérant de créer votre compte.",
      );
    }

    // Le premier compte devient gérant. Le rôle est décidé ICI, par le serveur.
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: Role.MANAGER,
    });

    return this.buildAuthResponse(user);
  }

  // CONNEXION : vérifie l'email et le mot de passe.
  async login(dto: LoginDto) {
    // On retrouve l'utilisateur avec son mot de passe haché
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // bcrypt.compare hache le mot de passe saisi et le compare au hachage enregistré
    const passwordIsValid = user
      ? await bcrypt.compare(dto.password, user.password)
      : false;

    // Même message si l'email n'existe pas ou si le mot de passe est faux :
    // on ne révèle pas à un attaquant quel email existe dans la base.
    if (!user || !passwordIsValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    return this.buildAuthResponse(user);
  }

  // Fabrique la réponse envoyée au client : le token et les infos de l'utilisateur.
  private async buildAuthResponse(user: User) {
    // Le "payload" est le contenu du token.
    // "sub" (subject) est le nom standard pour l'id de l'utilisateur.
    // On n'y met JAMAIS le mot de passe : le contenu d'un token peut être lu par n'importe qui.
    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      // Le token JWT, signé avec JWT_SECRET
      accessToken: await this.jwtService.signAsync(payload),
      // On renvoie seulement les champs utiles, sans mot de passe
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}