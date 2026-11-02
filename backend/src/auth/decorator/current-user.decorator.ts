import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '../../users/user.entity';

// La forme de l'utilisateur connecté, telle que JwtStrategy.validate() la place dans la requête
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}

// @CurrentUser() : un décorateur de paramètre qui donne directement l'utilisateur connecté.
// Au lieu d'aller chercher request.user à la main dans chaque contrôleur, on écrit :
//   remove(@CurrentUser() current: AuthUser) { ... }
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);