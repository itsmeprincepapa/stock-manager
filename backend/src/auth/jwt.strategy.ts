import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../users/user.entity';

// Le contenu du token, tel qu'on l'a fabriqué dans AuthService (buildAuthResponse)
export interface JwtPayload {
  sub: number; // id de l'utilisateur
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    // On configure la façon de lire et de vérifier le token
    super({
      // Le token est lu dans l'en-tête de la requête : Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Un token expiré est refusé (durée définie par JWT_EXPIRES_IN)
      ignoreExpiration: false,
      // La clé secrète qui sert à vérifier la signature du token.
      // getOrThrow : fait planter le démarrage si JWT_SECRET est absent du .env,
      // ce qui vaut mieux que de tourner avec une clé vide.
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Appelée automatiquement APRÈS que la signature du token a été vérifiée.
  // Ce qu'on renvoie ici est placé dans "request.user" et sera disponible
  // dans les contrôleurs et les guards.
  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}