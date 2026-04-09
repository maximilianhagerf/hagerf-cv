import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";
import { upsertProfile } from "../src/server/profile.js";
import {
  createCV,
  listCVs,
  renameCV,
  deleteCV,
  duplicateCV,
  isCreateCVError,
  CV_DOCUMENT_LIMIT,
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

// ---------------------------------------------------------------------------
// CV Documents CRUD
// ---------------------------------------------------------------------------

describe("cv_documents CRUD", () => {
  it("creates a CV document with a default label", async () => {
    const userId = await makeUser();

    const result = await createCV(userId, "My First CV", db as Parameters<typeof createCV>[2]);

    expect(isCreateCVError(result)).toBe(false);
    if (!isCreateCVError(result)) {
      expect(result.label).toBe("My First CV");
      expect(result.user_id).toBe(userId);
      expect(result.id).toBeTruthy();
      expect(result.share_token).toBeTruthy();
    }
  });

  it("listCVs returns CV documents ordered by updated_at desc", async () => {
    const userId = await makeUser();

    await createCV(userId, "CV A", db as Parameters<typeof createCV>[2]);
    await createCV(userId, "CV B", db as Parameters<typeof createCV>[2]);

    const cvs = await listCVs(userId, db as Parameters<typeof listCVs>[1]);
    expect(cvs.length).toBe(2);
    // Both should belong to the user
    for (const cv of cvs) {
      expect(cv.user_id).toBe(userId);
    }
  });

  it(`allows creating up to ${CV_DOCUMENT_LIMIT} documents (1–10 succeed)`, async () => {
    const userId = await makeUser();

    const results = [];
    for (let i = 1; i <= CV_DOCUMENT_LIMIT; i++) {
      const result = await createCV(userId, `CV ${i}`, db as Parameters<typeof createCV>[2]);
      results.push(result);
    }

    for (const r of results) {
      expect(isCreateCVError(r)).toBe(false);
    }

    const cvs = await listCVs(userId, db as Parameters<typeof listCVs>[1]);
    expect(cvs.length).toBe(CV_DOCUMENT_LIMIT);
  });

  it("returns a limit error on the 11th createCV without inserting", async () => {
    const userId = await makeUser();

    for (let i = 1; i <= CV_DOCUMENT_LIMIT; i++) {
      await createCV(userId, `CV ${i}`, db as Parameters<typeof createCV>[2]);
    }

    const extra = await createCV(userId, "CV 11", db as Parameters<typeof createCV>[2]);
    expect(isCreateCVError(extra)).toBe(true);
    if (isCreateCVError(extra)) {
      expect(extra.error).toContain("limit");
    }

    // Verify no row was inserted
    const cvs = await listCVs(userId, db as Parameters<typeof listCVs>[1]);
    expect(cvs.length).toBe(CV_DOCUMENT_LIMIT);
  });

  it("renames a CV document", async () => {
    const userId = await makeUser();
    const created = await createCV(userId, "Original", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(created)) throw new Error("unexpected error");

    const renamed = await renameCV(userId, created.id, "Renamed", db as Parameters<typeof renameCV>[3]);
    expect(renamed?.label).toBe("Renamed");
  });

  it("renameCV does not affect another user's CV", async () => {
    const userA = await makeUser();
    const userB = await makeUser();

    const created = await createCV(userA, "UserA CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(created)) throw new Error("unexpected error");

    const result = await renameCV(userB, created.id, "Hacked", db as Parameters<typeof renameCV>[3]);
    expect(result).toBeNull();

    const rows = await db
      .select()
      .from(schema.cv_documents)
      .where(eq(schema.cv_documents.id, created.id));
    expect(rows[0]?.label).toBe("UserA CV");
  });

  it("deleteCV removes the row", async () => {
    const userId = await makeUser();
    const created = await createCV(userId, "To Delete", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(created)) throw new Error("unexpected error");

    await deleteCV(userId, created.id, db as Parameters<typeof deleteCV>[2]);

    const rows = await db
      .select()
      .from(schema.cv_documents)
      .where(eq(schema.cv_documents.id, created.id));
    expect(rows).toHaveLength(0);
  });

  it("deleteCV does not remove another user's CV", async () => {
    const userA = await makeUser();
    const userB = await makeUser();

    const created = await createCV(userA, "UserA CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(created)) throw new Error("unexpected error");

    await deleteCV(userB, created.id, db as Parameters<typeof deleteCV>[2]);

    const rows = await db
      .select()
      .from(schema.cv_documents)
      .where(eq(schema.cv_documents.id, created.id));
    expect(rows).toHaveLength(1);
  });

  it("duplicateCV creates a copy with 'Copy of' prefix and same sections_config", async () => {
    const userId = await makeUser();
    const created = await createCV(userId, "Original", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(created)) throw new Error("unexpected error");

    // Update sections_config to something non-default
    await db
      .update(schema.cv_documents)
      .set({ sections_config: [{ type: "header", visible: true, sort_order: 0 }] as unknown as typeof schema.cv_documents.$inferInsert["sections_config"] })
      .where(eq(schema.cv_documents.id, created.id));

    const duplicate = await duplicateCV(userId, created.id, db as Parameters<typeof duplicateCV>[2]);
    expect(isCreateCVError(duplicate)).toBe(false);
    if (!isCreateCVError(duplicate)) {
      expect(duplicate.label).toBe("Copy of Original");
      expect(duplicate.user_id).toBe(userId);
      expect(duplicate.id).not.toBe(created.id);
      expect(duplicate.share_token).not.toBe(created.share_token);
    }
  });

  it("duplicateCV returns a limit error when user already has 10 CVs", async () => {
    const userId = await makeUser();

    const first = await createCV(userId, "CV 1", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(first)) throw new Error("unexpected error");

    for (let i = 2; i <= CV_DOCUMENT_LIMIT; i++) {
      await createCV(userId, `CV ${i}`, db as Parameters<typeof createCV>[2]);
    }

    const result = await duplicateCV(userId, first.id, db as Parameters<typeof duplicateCV>[2]);
    expect(isCreateCVError(result)).toBe(true);
    if (isCreateCVError(result)) {
      expect(result.error).toContain("limit");
    }
  });
});
