import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AvisModule } from './avis/avis.module.js';
import { AuthGuard } from './common/guards.js';
import { configuration } from './config/configuration.js';
import { DemandesModule } from './demandes/demandes.module.js';
import { DevisModule } from './devis/devis.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ParametresModule } from './parametres/parametres.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ReferentielsModule } from './referentiels/referentiels.module.js';
import { SmsModule } from './sms/sms.module.js';
import { TechniciensModule } from './techniciens/techniciens.module.js';
import { UsersModule } from './users/users.module.js';
import { VerificationsModule } from './verifications/verifications.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    SmsModule,
    NotificationsModule,
    ParametresModule,
    AuthModule,
    UsersModule,
    ReferentielsModule,
    TechniciensModule,
    DemandesModule,
    DevisModule,
    MessagesModule,
    AvisModule,
    VerificationsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
