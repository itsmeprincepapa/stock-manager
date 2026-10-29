import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/user.entity';

// Nom de l'étiquette qui contiendra la liste des rôles autorisés
export const ROLES_KEY = 'roles';

// @Roles(Role.MANAGER) : à placer sur une route pour dire quels rôles y ont accès.
// On peut en indiquer plusieurs : @Roles(Role.MANAGER, Role.SELLER).
// ...roles rassemble tous les arguments dans un tableau.
// Une route SANS @Roles est accessible à tout utilisateur connecté.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);