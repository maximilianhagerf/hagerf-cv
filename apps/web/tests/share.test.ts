import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/db/schema.js";
import { upsertProfile } from "../src/server/profile.js";
import {
  createCV,
  isCreateCVError,
  toggleCVPublic,
  regenerateShareToken,
  getPublicCV,
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
// getPublicCV
// ---------------------------------------------------------------------------

describe("getPublicCV", () => {
  it("returns CVData for a public CV with a valid token", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);

    const data = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);

    expect(data).not.toBeNull();
    expect(data?.id).toBe(cv.id);
    expect(data?.label).toBe("Test CV");
    expect(data?.profile).toBeDefined();
  });

  it("returns null for a private CV", async () => {
    const userId = await makeUser();
    const cv = await createCV(userId, "Private CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(cv)) throw new Error("unexpected error");

    // CV is private by default
    const data = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);

    expect(data).toBeNull();
  });

  it("returns null for an unknown token", async () => {
    const data = await getPublicCV("nonexistent-token-xyz", db as Parameters<typeof getPublicCV>[1]);
    expect(data).toBeNull();
  });

  it("returns null after a CV is toggled back to private", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);

    // Confirm it's accessible while public
    const publicData = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    expect(publicData).not.toBeNull();

    // Toggle back to private
    await toggleCVPublic(userId, cv.id, false, db as Parameters<typeof toggleCVPublic>[3]);

    const privateData = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    expect(privateData).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// regenerateShareToken
// ---------------------------------------------------------------------------

describe("regenerateShareToken", () => {
  it("makes the old token return null and the new token return data", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);
    const oldToken = cv.share_token;

    // Old token works
    const before = await getPublicCV(oldToken, db as Parameters<typeof getPublicCV>[1]);
    expect(before).not.toBeNull();

    // Regenerate
    const updated = await regenerateShareToken(userId, cv.id, db as Parameters<typeof regenerateShareToken>[2]);
    expect(updated).not.toBeNull();
    expect(updated?.share_token).not.toBe(oldToken);

    // Old token no longer works
    const afterOld = await getPublicCV(oldToken, db as Parameters<typeof getPublicCV>[1]);
    expect(afterOld).toBeNull();

    // New token works
    const afterNew = await getPublicCV(updated!.share_token, db as Parameters<typeof getPublicCV>[1]);
    expect(afterNew).not.toBeNull();
    expect(afterNew?.id).toBe(cv.id);
  });

  it("does not affect another user's CV token", async () => {
    const userA = await makeUser();
    const userB = await makeUser();
    const cv = await makePublicCV(userA);

    const result = await regenerateShareToken(userB, cv.id, db as Parameters<typeof regenerateShareToken>[2]);
    expect(result).toBeNull();

    // Token unchanged — CV is still accessible via old token
    const data = await getPublicCV(cv.share_token, db as Parameters<typeof getPublicCV>[1]);
    expect(data).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// toggleCVPublic
// ---------------------------------------------------------------------------

describe("toggleCVPublic", () => {
  it("sets is_public to true", async () => {
    const userId = await makeUser();
    const cv = await createCV(userId, "CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(cv)) throw new Error("unexpected error");

    const updated = await toggleCVPublic(userId, cv.id, true, db as Parameters<typeof toggleCVPublic>[3]);
    expect(updated?.is_public).toBe(true);
  });

  it("sets is_public to false", async () => {
    const userId = await makeUser();
    const cv = await makePublicCV(userId);

    const updated = await toggleCVPublic(userId, cv.id, false, db as Parameters<typeof toggleCVPublic>[3]);
    expect(updated?.is_public).toBe(false);
  });

  it("does not affect another user's CV", async () => {
    const userA = await makeUser();
    const userB = await makeUser();
    const cv = await createCV(userA, "CV", db as Parameters<typeof createCV>[2]);
    if (isCreateCVError(cv)) throw new Error("unexpected error");

    const result = await toggleCVPublic(userB, cv.id, true, db as Parameters<typeof toggleCVPublic>[3]);
    expect(result).toBeNull();
  });
});
