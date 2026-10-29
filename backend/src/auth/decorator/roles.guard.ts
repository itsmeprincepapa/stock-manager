import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/user.entity';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector : permet de lire les étiquettes collées par @Roles()
  constructor(private readonly reflector: Reflector) {}

  // Appelée à chaque requête, APRÈS JwtAuthGuard.
  // Renvoie true pour laisser passer, ou lève une erreur pour refuser.
  canActivate(context: ExecutionContext): boolean {
    // On lit la liste des rôles autorisés, d'abord sur la méthode, puis sur le contrôleur
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Aucun @Roles sur la route : tout utilisateur connecté (ou la route publique) passe
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // request.user a été rempli par JwtStrategy.validate() après la vérification du token
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: Role } }>();
    const user = request.user;

    // On refuse si l'utilisateur est absent ou si son rôle n'est pas dans la liste
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits nécessaires pour cette action.",
      );
    }

    return true;
  }
}