import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Role } from '../generated/prisma/client.js';
import { ROLES, ROUTE_PUBLIQUE, type UtilisateurConnecte } from './auth.js';

/** Extrait le jeton « Authorization: Bearer … ». */
export function jetonBearer(entete?: string): string | undefined {
  const [type, jeton] = entete?.split(' ') ?? [];
  return type === 'Bearer' ? jeton : undefined;
}

/**
 * Garde globale : toute route exige un jeton d'accès valide, sauf celles marquées @Public().
 * Vérifie ensuite le rôle si la route porte @Roles(...).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const cibles = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(ROUTE_PUBLIQUE, cibles))
      return true;

    const requete = ctx.switchToHttp().getRequest();
    const jeton = jetonBearer(requete.headers.authorization);
    if (!jeton) throw new UnauthorizedException('Connexion requise.');
    try {
      const charge = await this.jwt.verifyAsync<{
        sub: string;
        role: Role;
        type: string;
      }>(jeton, {
        secret: this.config.getOrThrow('jwt.accessSecret'),
      });
      if (charge.type !== 'acces') throw new Error();
      requete.user = {
        id: charge.sub,
        role: charge.role,
      } satisfies UtilisateurConnecte;
    } catch {
      throw new UnauthorizedException('Session expirée ou invalide.');
    }

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, cibles);
    if (roles?.length && !roles.includes(requete.user.role))
      throw new ForbiddenException('Accès réservé.');
    return true;
  }
}
