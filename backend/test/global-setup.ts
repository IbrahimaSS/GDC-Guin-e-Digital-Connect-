import { execSync } from 'node:child_process';
import pg from 'pg';
import { urlBaseTest } from './base-test.js';

/** Crée la base de test si besoin et lui applique les migrations. */
export default async function setup() {
  const url = new URL(urlBaseTest());
  const base = url.pathname.slice(1);
  const admin = new URL(url);
  admin.pathname = '/postgres';
  admin.search = '';

  const client = new pg.Client({ connectionString: admin.toString() });
  await client.connect();
  const { rowCount } = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [base],
  );
  if (!rowCount)
    await client.query(`CREATE DATABASE "${base.replace(/"/g, '')}"`);
  await client.end();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: url.toString() },
    stdio: 'ignore',
  });
}
