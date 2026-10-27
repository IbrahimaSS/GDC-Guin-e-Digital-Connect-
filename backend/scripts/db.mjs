// Base PostgreSQL de développement, sans installation : `npm run db`.
// Les données sont conservées dans .pgdata/ (ignoré par git). Ctrl + C pour arrêter.
// En production ou avec Docker, utiliser plutôt docker-compose.yml et un vrai serveur PostgreSQL.
import 'dotenv/config';
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const url = new URL(
  process.env.DATABASE_URL ?? 'postgresql://gdc:gdc@localhost:5433/gdc',
);
const dossier = resolve('.pgdata');
const base = url.pathname.slice(1) || 'gdc';

const pg = new EmbeddedPostgres({
  databaseDir: dossier,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5433),
  persistent: true,
  onLog: () => {},
});

const premiereFois = !existsSync(dossier);
if (premiereFois) await pg.initialise();
await pg.start();
if (premiereFois) await pg.createDatabase(base);

console.log(
  `PostgreSQL prêt sur le port ${url.port || 5433} (base « ${base} »). Ctrl + C pour arrêter.`,
);

const arreter = async () => {
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', arreter);
process.on('SIGTERM', arreter);
