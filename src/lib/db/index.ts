import path from "node:path";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import * as schema from "./schema";

export type DB = PgliteDatabase<typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

type Holder = { db: DB; ready: Promise<void> };
const globalForDb = globalThis as unknown as { __pestlaunchDb?: Holder };

async function create(): Promise<Holder> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    const db = drizzle(neon(url), { schema });
    // The query API is identical across drivers; the cast keeps one DB type for the app.
    return { db: db as unknown as DB, ready: migrate(db, { migrationsFolder: MIGRATIONS }) };
  }
