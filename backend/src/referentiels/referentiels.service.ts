import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  MetierDto,
  ModifierMetierDto,
  ModifierZoneDto,
  ZoneDto,
} from './referentiels.dto.js';

@Injectable()
export class ReferentielsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Métiers avec le nombre de techniciens visibles (vérifiés, compte actif). */
  async metiers(tous = false) {
    const metiers = await this.prisma.metier.findMany({
      where: tous ? {} : { actif: true },
      orderBy: { label: 'asc' },
      include: {
        _count: {
          select: {
            techniciens: {
              where: { niveau: { gte: 1 }, user: { statut: 'ACTIF' } },
            },
          },
        },
      },
    });
    return metiers.map(({ _count, ...m }) => ({
      ...m,
      nbTechniciens: _count.techniciens,
    }));
  }

  creerMetier(dto: MetierDto) {
    return this.prisma.metier
      .create({ data: { ...dto, specialites: dto.specialites ?? [] } })
      .catch(() => {
        throw new BadRequestException('Ce métier existe déjà.');
      });
  }

  async modifierMetier(id: string, dto: ModifierMetierDto) {
    await this.prisma.metier.findUniqueOrThrow({ where: { id } }).catch(() => {
      throw new NotFoundException('Métier introuvable.');
    });
    return this.prisma.metier.update({ where: { id }, data: dto });
  }

  /** Un métier utilisé n'est jamais supprimé : il est désactivé. */
  async supprimerMetier(id: string) {
    const utilise = await this.prisma.metier.findUnique({
      where: { id },
      include: { _count: { select: { techniciens: true, demandes: true } } },
    });
    if (!utilise) throw new NotFoundException('Métier introuvable.');
    if (utilise._count.techniciens || utilise._count.demandes)
      return this.prisma.metier.update({
        where: { id },
        data: { actif: false },
      });
    return this.prisma.metier.delete({ where: { id } });
  }

  zones(tous = false) {
    return this.prisma.zone.findMany({
      where: tous ? {} : { actif: true },
      orderBy: { nom: 'asc' },
    });
  }

  creerZone(dto: ZoneDto) {
    return this.prisma.zone.create({ data: dto }).catch(() => {
      throw new BadRequestException('Cette zone existe déjà.');
    });
  }

  async modifierZone(id: string, dto: ModifierZoneDto) {
    await this.prisma.zone.findUniqueOrThrow({ where: { id } }).catch(() => {
      throw new NotFoundException('Zone introuvable.');
    });
    return this.prisma.zone.update({ where: { id }, data: dto });
  }

  async supprimerZone(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        _count: {
          select: { utilisateurs: true, demandes: true, techniciens: true },
        },
      },
    });
    if (!zone) throw new NotFoundException('Zone introuvable.');
    const { utilisateurs, demandes, techniciens } = zone._count;
    if (utilisateurs || demandes || techniciens)
      return this.prisma.zone.update({ where: { id }, data: { actif: false } });
    return this.prisma.zone.delete({ where: { id } });
  }
}
