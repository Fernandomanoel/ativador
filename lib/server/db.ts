import "server-only";

// Acesso ao Postgres. Em produção usa DATABASE_URL (ou POSTGRES_URL, que a Vercel
// cria ao ligar um banco Neon/Postgres ao projeto). Em desenvolvimento, sem essas
// variáveis, usa um Postgres embutido (PGlite) gravado em .data/, para testar sem
// instalar nada.

export interface Db {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

const g = globalThis as unknown as { __vivlioDb?: Promise<Db | null> };

export const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

const useLocalDb = () => !databaseUrl() && (process.env.NODE_ENV !== "production" || !!process.env.VIVLIO_LOCAL_DB);

export const dbConfigured = () => !!databaseUrl() || useLocalDb();

async function connect(): Promise<Db | null> {
  const url = databaseUrl();
  if (url) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(url, { max: 3, idle_timeout: 20, prepare: false, ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require" });
    return { query: async (text, params = []) => (await sql.unsafe(text, params as never[])) as never };
  }
  if (useLocalDb()) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    const dir = process.env.VIVLIO_LOCAL_DB || ".data/pglite";
    mkdirSync(dir, { recursive: true });
    const db = new PGlite(dir);
    return { query: async (text, params = []) => (await db.query(text, params)).rows as never };
  }
  return null;
}

let migrated: Promise<void> | null = null;

export async function getDb(): Promise<Db | null> {
  g.__vivlioDb ??= connect();
  const db = await g.__vivlioDb;
  if (!db) return null;
  migrated ??= (async () => {
    await db.query(`create table if not exists vivlio_world (
      id integer primary key,
      version integer not null,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )`);
    await db.query(`create table if not exists vivlio_media (
      id text primary key,
      owner text not null,
      mime text not null,
      data text not null,
      created_at timestamptz not null default now()
    )`);
  })();
  await migrated;
  return db;
}
