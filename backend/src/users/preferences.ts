import type { Prisma } from '../generated/prisma/client.js';

/** Préférences de notification par défaut : SMS et WhatsApp activés. */
export const PREFERENCES_DEFAUT = {
  sms: true,
  whatsapp: true,
  email: false,
  actualites: false,
};
export type Preferences = typeof PREFERENCES_DEFAUT;

/** Préférences enregistrées (JSON), complétées par les valeurs par défaut. */
export const lirePreferences = (valeur: Prisma.JsonValue): Preferences => ({
  ...PREFERENCES_DEFAUT,
  ...(valeur && typeof valeur === 'object' && !Array.isArray(valeur)
    ? (valeur as Partial<Preferences>)
    : {}),
});
