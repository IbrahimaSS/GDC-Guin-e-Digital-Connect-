import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Roles,
  Utilisateur,
  type UtilisateurConnecte,
} from '../common/auth.js';
import {
  MODELES,
  NotificationsService,
  type Evenement,
} from './notifications.service.js';

class ModeleDto {
  @IsArray()
  @ArrayUnique()
  @IsIn(['sms', 'whatsapp'], { each: true })
  canaux: ('sms' | 'whatsapp')[];

  @IsString()
  @MinLength(5)
  @MaxLength(480)
  texte: string;
}

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  liste(@Utilisateur() u: UtilisateurConnecte) {
    return this.notifications.liste(u.id);
  }

  @Patch(':id/lu')
  @HttpCode(204)
  lue(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.notifications.marquerLue(u.id, id);
  }

  @Post('tout-lu')
  @HttpCode(204)
  toutLire(@Utilisateur() u: UtilisateurConnecte) {
    return this.notifications.toutLire(u.id);
  }

  @Delete(':id')
  @HttpCode(204)
  supprimer(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.notifications.supprimer(u.id, id);
  }
}

@ApiTags('Back-office')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('modeles')
  modeles() {
    return this.notifications.modeles();
  }

  @Put('modeles/:evenement')
  modifier(@Param('evenement') evenement: string, @Body() dto: ModeleDto) {
    return this.notifications.modifierModele(
      this.evenement(evenement),
      dto.canaux,
      dto.texte,
    );
  }

  @Delete('modeles/:evenement')
  @HttpCode(204)
  reinitialiser(@Param('evenement') evenement: string) {
    return this.notifications.reinitialiserModele(this.evenement(evenement));
  }

  @Get('journal')
  journal() {
    return this.notifications.journal();
  }

  private evenement(e: string): Evenement {
    return (e in MODELES ? e : 'inconnu') as Evenement;
  }
}
