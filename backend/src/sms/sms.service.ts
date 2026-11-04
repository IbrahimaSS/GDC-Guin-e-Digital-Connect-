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

/**
 * Pilote Twilio (SMS et WhatsApp) : SMS_DRIVER=twilio, avec TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * TWILIO_FROM (numéro ou nom d'expéditeur SMS) et, pour WhatsApp, TWILIO_WHATSAPP_FROM.
 */
class PiloteTwilio implements PiloteMessages {
  private readonly log = new Logger('SMS');
  constructor(
    private readonly sid: string,
    private readonly jeton: string,
    private readonly expediteur: string,
    private readonly expediteurWhatsapp: string,
  ) {}

  async envoyer({ canal, numero, texte }: MessageSortant) {
    const whatsapp = canal === 'whatsapp';
    if (whatsapp && !this.expediteurWhatsapp) return; // WhatsApp non configuré : rien à envoyer
    const corps = new URLSearchParams({
      To: whatsapp ? `whatsapp:${numero}` : numero,
      From: whatsapp ? `whatsapp:${this.expediteurWhatsapp}` : this.expediteur,
      Body: texte,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${this.sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.sid}:${this.jeton}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: corps,
      },
    );
    if (!res.ok)
      this.log.error(
        `Envoi ${canal} vers ${numero} refusé (${res.status}) : ${await res.text()}`,
      );
  }
}

@Injectable()
export class SmsService {
  private readonly pilote: PiloteMessages;
  /** Derniers messages envoyés (développement et tests uniquement). */
  readonly historique: MessageSortant[] = [];

  constructor(config: ConfigService) {
    const nom = config.get<string>('smsDriver');
    const t = config.get<Record<string, string>>('twilio') ?? {};
    if (nom === 'twilio' && t.sid && t.jeton && t.expediteur) {
      this.pilote = new PiloteTwilio(
        t.sid,
        t.jeton,
        t.expediteur,
        t.expediteurWhatsapp ?? '',
      );
      return;
    }
    if (nom !== 'console')
      new Logger('SMS').warn(
        `Pilote « ${nom} » non disponible ou incomplet, utilisation de la console.`,
      );
    if (process.env.NODE_ENV === 'production')
      new Logger('SMS').error(
        'Aucun SMS ne sera envoyé : configurez SMS_DRIVER=twilio et les variables TWILIO_*. ' +
          'Sans cela, personne ne peut recevoir son code de connexion.',
      );
    this.pilote = new PiloteConsole();
  }

  async envoyer(message: MessageSortant) {
    this.historique.unshift(message);
    this.historique.length = Math.min(this.historique.length, 50);
    await this.pilote.envoyer(message);
  }
}
