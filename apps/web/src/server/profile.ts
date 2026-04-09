import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema.js";
import { profiles } from "../db/schema.js";
import { db as defaultDb } from "../db/index.js";

type AnyDb = PostgresJsDatabase<typeof schema>;

/**
 * Idempotently upsert a profile row.
 * On first call it creates the row; on subsequent calls it only updates `updated_at`.
 * This pure function is tested directly in the integration test suite.
 */
export async function upsertProfile(
  userId: string,
  email: string | null,
  name: string | null = null,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<void> {
  const now = new Date();
  await dbInstance
    .insert(profiles)
    .values({
      id: userId,
      email,
      name,
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: { updated_at: now },
    });
}
