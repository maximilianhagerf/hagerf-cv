import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema.js";
import { profiles } from "../db/schema.js";
import { db as defaultDb } from "../db/index.js";
import { eq } from "drizzle-orm";

type AnyDb = PostgresJsDatabase<typeof schema>;

export type ProfileLink = {
  type: "linkedin" | "github" | "twitter" | "youtube" | "custom";
  url: string;
  label?: string;
};

export type ProfileData = {
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  email?: string | null;
  location?: string | null;
  links?: ProfileLink[];
};

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

/**
 * Save full profile data (name, headline, bio, email, location, links).
 * Upserts the row — no duplicates created.
 */
export async function saveProfileData(
  userId: string,
  data: ProfileData,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<void> {
  const now = new Date();
  await dbInstance
    .insert(profiles)
    .values({
      id: userId,
      name: data.name ?? null,
      headline: data.headline ?? null,
      bio: data.bio ?? null,
      email: data.email ?? null,
      location: data.location ?? null,
      links: (data.links ?? []) as unknown as Record<string, unknown>[],
      created_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        name: data.name ?? null,
        headline: data.headline ?? null,
        bio: data.bio ?? null,
        email: data.email ?? null,
        location: data.location ?? null,
        links: (data.links ?? []) as unknown as Record<string, unknown>[],
        updated_at: now,
      },
    });
}

/**
 * Update only the photo_url column on a profile row.
 */
export async function updateProfilePhotoUrl(
  userId: string,
  photoUrl: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<void> {
  await dbInstance
    .update(profiles)
    .set({ photo_url: photoUrl, updated_at: new Date() })
    .where(eq(profiles.id, userId));
}
