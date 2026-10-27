import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '../generated/prisma/client.js';

/** Utilisateur authentifié, tel que porté par le jeton d'accès. */
export interface UtilisateurConnecte {
  id: string;
  role: Role;
}

export const ROUTE_PUBLIQUE = 'routePublique';
/** La route est accessible sans être connecté. */
export const Public = () => SetMetadata(ROUTE_PUBLIQUE, true);

export const ROLES = 'roles';
/** La route est réservée aux rôles indiqués. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Injecte l'utilisateur connecté dans un paramètre de contrôleur. */
export const Utilisateur = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UtilisateurConnecte => {
    return ctx.switchToHttp().getRequest().user;
  },
);
