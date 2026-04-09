import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";
import { upsertProfile } from "../src/server/profile.js";

const TEST_DB_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5433/hagerf_cv_test";

describe("upsertProfile", () => {
  const client = postgres(TEST_DB_URL);
  const db = drizzle(client, { schema });

  afterAll(async () => {
    await client.end();
  });

  it("creates a new profile row on first call", async () => {
    const userId = crypto.randomUUID();

    await upsertProfile(userId, "new@example.com", null, db);

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("new@example.com");
    expect(rows[0]?.id).toBe(userId);
  });

  it("does not create a duplicate row on second call (idempotent)", async () => {
    const userId = crypto.randomUUID();

    await upsertProfile(userId, "dup@example.com", null, db);
    await upsertProfile(userId, "dup@example.com", null, db);

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(rows).toHaveLength(1);
  });

  it("updates updated_at on second call without erroring", async () => {
    const userId = crypto.randomUUID();

    await upsertProfile(userId, "update@example.com", null, db);
    const [first] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    // Wait 2ms to ensure updated_at changes
    await new Promise((resolve) => setTimeout(resolve, 2));

    // Second call must not throw
    await expect(upsertProfile(userId, "update@example.com", null, db)).resolves.toBeUndefined();

    const [second] = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(second?.updated_at.getTime()).toBeGreaterThanOrEqual(
      first!.updated_at.getTime(),
    );
  });
});
