import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";
import { upsertProfile } from "../src/server/profile.js";
import {
  createCV,
  isCreateCVError,
  toggleCVPublic,
  getPublicCV,
  getCVViewCount,
} from "../src/server/cv.js";

const TEST_DB_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5433/hagerf_cv_test";

const client = postgres(TEST_DB_URL);
const db = drizzle(client, { schema });

afterAll(async () => {
  await client.end();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeUser() {
  const userId = crypto.randomUUID();
  await upsertProfile(
    userId,
    `${userId}@test.example`,
    null,
    db as Parameters<typeof upsertProfile>[3],
  );
  return userId;
}

async function makePublicCV(userId: string) {
  const cv = await createCV(userId, "Test CV", db as Parameters<typeof createCV>[2]);
  if (isCreateCVError(cv)) throw new Error("unexpected error creating CV");
  const toggled = await toggleCVPublic(userId, cv.id, true, db as Parameters<typeof toggleCVPublic>[3]);
  if (!toggled) throw new Error("unexpected null toggling CV public");
  return toggled;
}

// ---------------------------------------------------------------------------
// cv_views tracking
// ---------------------------------------------------------------------------

describe("cv_views tracking", () => {
  it("inserts a view row when a public CV is accessed", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);

    await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);

    const views = await db
      .select()
      .from(schema.cv_views)
      .where(eq(schema.cv_views.cv_document_id, cv.id));

    expect(views).toHaveLength(1);
    expect(views[0]?.cv_document_id).toBe(cv.id);
    expect(views[0]?.viewed_at).toBeInstanceOf(Date);
  });

  it("accumulates multiple view rows on repeated access", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);

    await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);

    const count = await getCVViewCount(cv.id, db as Parameters<typeof getCVViewCount>[1]);
    expect(count).toBe(3);
  });

  it("does not insert a view row for a private CV", async () => {
    const userId = await makeUser();
    const cv = await createCV(userId, "Private CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(cv)) throw new Error("unexpected error");

    // CV is private by default — getPublicCV returns null
    const result = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    expect(result).toBeNull();

    const views = await db
      .select()
      .from(schema.cv_views)
      .where(eq(schema.cv_views.cv_document_id, cv.id));

    expect(views).toHaveLength(0);
  });

  it("does not insert a view row for an unknown token", async () => {
    const userId = await makeUser();
    const cv = await createCV(userId, "Some CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(cv)) throw new Error("unexpected error");

    const result = await getPublicCV("definitely-not-a-real-token", db as Parameters<typeof getPublicCV>[1]);
    expect(result).toBeNull();

    // No view rows for this CV
    const views = await db
      .select()
      .from(schema.cv_views)
      .where(eq(schema.cv_views.cv_document_id, cv.id));
    expect(views).toHaveLength(0);
  });

  it("does not insert a view row for a CV toggled back to private", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);

    // Access while public — one view
    await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);

    // Toggle back to private
    await toggleCVPublic(userId, cv.id, false, db as Parameters<typeof toggleCVPublic>[3]);

    // Access while private — no new view
    const result = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    expect(result).toBeNull();

    const count = await getCVViewCount(cv.id, db as Parameters<typeof getCVViewCount>[1]);
    expect(count).toBe(1);
  });

  it("getCVViewCount returns 0 for a CV with no views", async () => {
    const userId = await makeUser();
    const cv = await createCV(userId, "No Views", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(cv)) throw new Error("unexpected error");

    const count = await getCVViewCount(cv.id, db as Parameters<typeof getCVViewCount>[1]);
    expect(count).toBe(0);
  });
});
