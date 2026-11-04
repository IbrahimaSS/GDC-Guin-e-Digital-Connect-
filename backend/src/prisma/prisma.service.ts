import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/** Client Prisma unique de l'application (un seul pool de connexions). */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly log = new Logger('Base de données');

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>('databaseUrl'),
      }),
    });
  }

  /**
   * Vérifie la base au démarrage. Si elle est éteinte, l'API démarre quand même
   * (elle se reconnecte dès que la base répond) mais le signale clairement.
   */
  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch {
      this.log.error(
        'PostgreSQL ne répond pas. Lancez la base dans un autre terminal : « npm run db » (ou « docker compose up -d »).',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
