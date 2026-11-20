import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { ensureSeriesSchema } from "./utils";

export function createDb(d1: D1Database = env.DB) {
  return drizzle(d1, { schema });
}

/**
 * Same as `createDb`, but waits until series/tags tables exist. Use on write
 * paths that insert into those tables so a missing migration fails with a
 * clear message instead of a bare D1 stack trace.
 */
export async function createDbReady(d1: D1Database = env.DB) {
  await ensureSeriesSchema(d1);
  return createDb(d1);
}

export type Database = ReturnType<typeof createDb>;

export { schema };
