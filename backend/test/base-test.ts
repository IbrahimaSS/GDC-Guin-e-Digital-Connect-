// Base de données dédiée aux tests e2e : même serveur que le développement, base « <nom>_test ».
import 'dotenv/config';

export function urlBaseTest(): string {
  if (process.env.DATABASE_URL_TEST) return process.env.DATABASE_URL_TEST;
  const url = new URL(
    process.env.DATABASE_URL ??
      'postgresql://gdc:gdc@localhost:5433/gdc?schema=public',
  );
  url.pathname = `${url.pathname.slice(1) || 'gdc'}_test`;
  return url.toString();
}
