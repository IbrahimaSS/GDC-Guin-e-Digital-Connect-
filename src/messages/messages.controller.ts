import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Utilisateur, type UtilisateurConnecte } from '../common/auth.js';
import { EnvoyerMessageDto } from './messages.dto.js';
import { MessagesService } from './messages.service.js';

@ApiTags('Messagerie')
@ApiBearerAuth()
@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get('conversations')
  conversations(@Utilisateur() u: UtilisateurConnecte) {
    return this.messages.conversations(u);
  }

  @Get('demandes/:id/messages')
  liste(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.messages.liste(id, u);
  }

  @Post('demandes/:id/messages')
  envoyer(
    @Utilisateur() u: UtilisateurConnecte,
    @Param('id') id: string,
    @Body() dto: EnvoyerMessageDto,
  ) {
    return this.messages.envoyer(id, u, dto);
  }

  @Post('demandes/:id/messages/lus')
  @HttpCode(200)
  marquerLus(@Utilisateur() u: UtilisateurConnecte, @Param('id') id: string) {
    return this.messages.marquerLus(id, u);
  }
}
