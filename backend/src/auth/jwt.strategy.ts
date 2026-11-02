import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../users/user.entity';
import { UsersService } from '../users/users.service';

// Le contenu du token, tel qu'on l'a fabriqué dans AuthService (buildAuthResponse)
export interface JwtPayload {
  sub: number; // id de l'utilisateur
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    // Pour retrouver l'utilisateur dans la base à chaque requête
    private readonly usersService: UsersService,
  ) {
    // On configure la façon de lire et de vérifier le token
    super({
      // Le token est lu dans l'en-tête de la requête : Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Un token expiré est refusé (durée définie par JWT_EXPIRES_IN)
      ignoreExpiration: false,
      // La clé secrète qui sert à vérifier la signature du token.
      // getOrThrow : fait planter le démarrage si JWT_SECRET est absent du .env.
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Appelée automatiquement APRÈS que la signature du token a été vérifiée.
  // Ce qu'on renvoie ici est placé dans "request.user".
  async validate(payload: JwtPayload) {
    // On relit l'utilisateur dans la base à chaque requête. Deux effets :
    // - un compte SUPPRIMÉ perd son accès tout de suite, sans attendre l'expiration du token ;
    // - un changement de RÔLE est pris en compte immédiatement : on utilise le rôle de
    //   la base, pas celui qui est écrit dans le token.
    const user = await this.usersService.findByIdOrNull(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Ce compte n’existe plus.');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}