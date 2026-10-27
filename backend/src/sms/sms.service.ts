import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type Canal = 'sms' | 'whatsapp';

export interface MessageSortant {
  canal: Canal;
  numero: string;
  texte: string;
}

/** Fournisseur d'envoi (SMS ou WhatsApp). Un pilote par opérateur, choisi par SMS_DRIVER. */
export interface PiloteMessages {
  envoyer(message: MessageSortant): Promise<void>;
}

/** Pilote de développement : affiche les messages dans le terminal au lieu de les envoyer. */
class PiloteConsole implements PiloteMessages {
  private readonly log = new Logger('SMS');
  async envoyer({ canal, numero, texte }: MessageSortant) {
    this.log.log(`[${canal.toUpperCase()}] → ${numero} : ${texte}`);
  }
}

@Injectable()
export class SmsService {
  private readonly pilote: PiloteMessages;
  /** Derniers messages envoyés (développement et tests uniquement). */
  readonly historique: MessageSortant[] = [];

  constructor(config: ConfigService) {
    const nom = config.get<string>('smsDriver');
    // TODO : pilotes réels (agrégateur SMS local, WhatsApp Business Cloud API) selon SMS_DRIVER.
    if (nom !== 'console')
      new Logger('SMS').warn(
        `Pilote « ${nom} » non disponible, utilisation de la console.`,
      );
    this.pilote = new PiloteConsole();
  }

  async envoyer(message: MessageSortant) {
    this.historique.unshift(message);
    this.historique.length = Math.min(this.historique.length, 50);
    await this.pilote.envoyer(message);
  }
}
