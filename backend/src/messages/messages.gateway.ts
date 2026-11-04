import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
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
export class MessagesGateway implements OnGatewayInit {
  @WebSocketServer() serveur: Namespace;

  constructor(
    private readonly messages: MessagesService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit(espace: Namespace) {
    this.messages.diffuseur = {
      diffuser: (s, evenement, donnees) =>
        this.serveur.to(s).emit(evenement, donnees),
    };
    // Le jeton est vérifié AVANT d'accepter la connexion : ainsi, l'utilisateur est connu dès le
    // premier événement (« rejoindre » est envoyé par le client aussitôt connecté). En cas de refus,
    // le client reçoit « connect_error » avec ce message.
    espace.use((socket, suivant) => {
      this.authentifier(socket)
        .then(() => suivant())
        .catch(() => suivant(new Error('Session expirée ou invalide.')));
    });
  }

  private async authentifier(socket: Socket) {
    const jeton =
      (socket.handshake.auth as { token?: string })?.token ??
      socket.handshake.headers.authorization?.replace(/^Bearer /, '');
    const charge = await this.jwt.verifyAsync<{
      sub: string;
      role: Role;
      type: string;
    }>(jeton ?? '', { secret: this.config.getOrThrow('jwt.accessSecret') });
    if (charge.type !== 'acces') throw new Error('Jeton invalide');
    socket.data.user = {
      id: charge.sub,
      role: charge.role,
    } satisfies UtilisateurConnecte;
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
      socket.to(s).emit('ecrit', {
        demandeId: corps.demandeId,
        auteurId: socket.data.user?.id,
      });
  }
}
