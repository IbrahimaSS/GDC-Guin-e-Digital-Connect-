import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { INCLURE_UTILISATEUR, presenterUtilisateur } from './presentation.js';
import type { ModifierProfilDto } from './users.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async moi(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: INCLURE_UTILISATEUR,
    });
    return presenterUtilisateur(user);
  }

  async modifier(id: string, dto: ModifierProfilDto) {
    if (dto.email) {
      const email = dto.email.toLowerCase();
      if (await this.prisma.user.findFirst({ where: { email, NOT: { id } } }))
        throw new BadRequestException(
          'Cette adresse e-mail est déjà utilisée.',
        );
      dto.email = email;
    }
    if (
      dto.zoneId &&
      !(await this.prisma.zone.findUnique({ where: { id: dto.zoneId } }))
    )
      throw new BadRequestException('Zone inconnue.');
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: INCLURE_UTILISATEUR,
    });
    return presenterUtilisateur(user);
  }

  async sessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revoqueLe: null, expireLe: { gt: new Date() } },
      select: { id: true, appareil: true, createdAt: true, expireLe: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
