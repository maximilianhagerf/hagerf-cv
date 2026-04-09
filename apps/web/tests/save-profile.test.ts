import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";
import { saveProfileData, updateProfilePhotoUrl, upsertProfile } from "../src/server/profile.js";
import type { ProfileLink } from "../src/server/profile.js";

const TEST_DB_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5433/hagerf_cv_test";

describe("saveProfileData", () => {
  const client = postgres(TEST_DB_URL);
  const db = drizzle(client, { schema });

  afterAll(async () => {
    await client.end();
  });

  it("creates a new profile row with all fields on first call", async () => {
    const userId = crypto.randomUUID();
    const links: ProfileLink[] = [
      { type: "linkedin", url: "https://linkedin.com/in/testuser" },
      { type: "github", url: "https://github.com/testuser" },
    ];

    await saveProfileData(
      userId,
      {
        name: "Jane Doe",
        headline: "Senior Engineer",
        bio: "Building great things.",
        email: "jane@example.com",
        location: "Stockholm, SE",
        links,
      },
      db,
    );

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.name).toBe("Jane Doe");
    expect(row.headline).toBe("Senior Engineer");
    expect(row.bio).toBe("Building great things.");
    expect(row.email).toBe("jane@example.com");
    expect(row.location).toBe("Stockholm, SE");
    expect(row.links).toEqual(links);
  });

  it("updates an existing profile without creating a duplicate", async () => {
    const userId = crypto.randomUUID();

    await upsertProfile(userId, "initial@example.com", "Initial Name", db);

    await saveProfileData(
      userId,
      { name: "Updated Name", headline: "Updated Headline", email: "updated@example.com" },
      db,
    );

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Updated Name");
    expect(rows[0]?.headline).toBe("Updated Headline");
    expect(rows[0]?.email).toBe("updated@example.com");
  });

  it("saves and retrieves social links correctly", async () => {
    const userId = crypto.randomUUID();
    const links: ProfileLink[] = [
      { type: "twitter", url: "https://twitter.com/testuser" },
      { type: "youtube", url: "https://youtube.com/@testuser" },
      { type: "custom", url: "https://mysite.com", label: "My Site" },
    ];

    await saveProfileData(userId, { links }, db);

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.links).toEqual(links);
  });
});

describe("updateProfilePhotoUrl", () => {
  const client = postgres(TEST_DB_URL);
  const db = drizzle(client, { schema });

  afterAll(async () => {
    await client.end();
  });

  it("updates photo_url on an existing profile", async () => {
    const userId = crypto.randomUUID();
    await upsertProfile(userId, "photo@example.com", null, db);

    const photoUrl = "https://example.com/storage/v1/object/public/avatars/avatar";
    await updateProfilePhotoUrl(userId, photoUrl, db);

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.photo_url).toBe(photoUrl);
  });

  it("persists photo_url across subsequent saveProfileData calls", async () => {
    const userId = crypto.randomUUID();
    await upsertProfile(userId, "persist@example.com", null, db);

    const photoUrl = "https://example.com/storage/v1/object/public/avatars/avatar";
    await updateProfilePhotoUrl(userId, photoUrl, db);

    // Update profile data (should not wipe photo_url)
    await saveProfileData(userId, { name: "New Name", headline: "New Headline" }, db);

    const rows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, userId));

    // saveProfileData does not overwrite photo_url since it's not in ProfileData
    expect(rows[0]?.photo_url).toBe(photoUrl);
    expect(rows[0]?.name).toBe("New Name");
  });
});
