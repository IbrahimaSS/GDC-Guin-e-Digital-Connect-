import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { UtilisateurConnecte } from '../common/auth.js';
import type { Role } from '../generated/prisma/client.js';
import { MessagesService, salon } from './messages.service.js';

/**
 * Messagerie temps réel. Connexion : io(`${API}/messagerie`, { auth: { token: <jeton d'accès> } }).
 * Le client rejoint une conversation avec « rejoindre » { demandeId } puis reçoit « message » et « lu ».
 * L'envoi passe par l'API REST (POST /api/demandes/:id/messages) : validation et notifications au même endroit.
 */
@WebSocketGateway({
  namespace: '/messagerie',
  cors: { origin: true, credentials: true },
})
export class MessagesGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly log = new Logger(MessagesGateway.name);
  @WebSocketServer() serveur: Server;

  constructor(
    private readonly messages: MessagesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.messages.diffuseur = {
      diffuser: (s, evenement, donnees) =>
        this.serveur.to(s).emit(evenement, donnees),
    };
  }

  async handleConnection(socket: Socket) {
    const jeton =
      (socket.handshake.auth as { token?: string })?.token ??
      socket.handshake.headers.authorization?.replace(/^Bearer /, '');
    try {
      const charge = await this.jwt.verifyAsync<{
        sub: string;
        role: Role;
        type: string;
      }>(jeton ?? '', { secret: this.config.getOrThrow('jwt.accessSecret') });
      if (charge.type !== 'acces') throw new Error();
      socket.data.user = {
        id: charge.sub,
        role: charge.role,
      } satisfies UtilisateurConnecte;
    } catch {
      socket.emit('erreur', { message: 'Session expirée ou invalide.' });
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('rejoindre')
  async rejoindre(
    @ConnectedSocket() socket: Socket,
    @MessageBody() corps: { demandeId?: string },
  ) {
    const user = socket.data.user as UtilisateurConnecte | undefined;
    if (!user || !corps?.demandeId) throw new WsException('Requête invalide.');
    try {
      await this.messages.verifierAcces(corps.demandeId, user);
    } catch (e) {
      throw new WsException((e as Error).message);
    }
    await socket.join(salon(corps.demandeId));
    return { ok: true };
  }

  @SubscribeMessage('quitter')
  async quitter(
    @ConnectedSocket() socket: Socket,
    @MessageBody() corps: { demandeId?: string },
  ) {
    if (corps?.demandeId) await socket.leave(salon(corps.demandeId));
    return { ok: true };
  }

  /** Indicateur « en train d'écrire… » relayé à l'interlocuteur. */
  @SubscribeMessage('ecrit')
  ecrit(
    @ConnectedSocket() socket: Socket,
    @MessageBody() corps: { demandeId?: string },
  ) {
    const s = corps?.demandeId && salon(corps.demandeId);
    if (s && socket.rooms.has(s))
      socket
        .to(s)
        .emit('ecrit', {
          demandeId: corps.demandeId,
          auteurId: socket.data.user?.id,
        });
  }
}
