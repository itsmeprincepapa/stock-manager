import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

// Ce guard vérifie le token JWT sur chaque requête.
// AuthGuard('jwt') utilise la JwtStrategy qu'on a écrite : elle lit le token
// dans l'en-tête Authorization et vérifie sa signature et sa date d'expiration.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Reflector : l'outil qui permet de LIRE les étiquettes (métadonnées) collées sur les routes
  constructor(private readonly reflector: Reflector) {
    super();
  }

  // Appelée à chaque requête, avant d'entrer dans le contrôleur
  canActivate(context: ExecutionContext) {
    // On cherche l'étiquette @Public() sur la route, puis sur le contrôleur
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Route publique : on laisse passer sans vérifier de token
    if (isPublic) {
      return true;
    }

    // Sinon, on lance la vérification du token (stratégie JWT)
    return super.canActivate(context);
  }

  // Appelée après la vérification : on choisit le message d'erreur (en français)
  // si le token est absent, invalide ou expiré.
  handleRequest<TUser>(err: unknown, user: TUser | false): TUser {
    if (err || !user) {
      throw new UnauthorizedException(
        'Connexion requise : token manquant, invalide ou expiré.',
      );
    }
    return user;
  }
}