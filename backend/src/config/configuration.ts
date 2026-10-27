// Configuration lue dans les variables d'environnement (.env), vérifiée au démarrage.

function requis(nom: string): string {
  const v = process.env[nom];
  if (!v) throw new Error(`Variable d'environnement manquante : ${nom}`);
  return v;
}

export const configuration = () => ({
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),
  databaseUrl: requis('DATABASE_URL'),
  jwt: {
    accessSecret: requis('JWT_ACCESS_SECRET'),
    refreshSecret: requis('JWT_REFRESH_SECRET'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
  },
  otp: {
    ttlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 5),
    maxEssais: Number(process.env.OTP_MAX_ESSAIS ?? 5),
  },
  smsDriver: process.env.SMS_DRIVER ?? 'console',
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
});

export type Configuration = ReturnType<typeof configuration>;
