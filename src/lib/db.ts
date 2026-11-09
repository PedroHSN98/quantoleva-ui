import { Pool } from "pg";

const g = globalThis as unknown as { __pool?: Pool };

export function pool(): Pool {
  if (!g.__pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
    g.__pool = new Pool({ connectionString: url, max: 10 });
  }
  return g.__pool;
}
