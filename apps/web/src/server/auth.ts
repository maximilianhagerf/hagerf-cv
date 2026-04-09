import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createSupabaseServerClient, createSupabaseServiceClient } from "../lib/supabase.js";
import { db, profiles } from "../db/index.js";
import { eq } from "drizzle-orm";
import {
  upsertProfile as upsertProfileFn,
  saveProfileData as saveProfileDataFn,
  updateProfilePhotoUrl as updateProfilePhotoUrlFn,
  type ProfileData,
  type ProfileLink,
} from "./profile.js";

/**
 * Returns the active session user, or null if unauthenticated.
 */
export const getSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * Initiates an OAuth sign-in flow with GitHub or Google.
 * Throws a redirect to the provider's authorization URL.
 */
export const signInWithOAuth = createServerFn({ method: "POST" })
  .validator((provider: unknown) => {
    if (provider !== "github" && provider !== "google") {
      throw new Error("provider must be 'github' or 'google'");
    }
    return provider as "github" | "google";
  })
  .handler(async ({ data: provider }) => {
    const supabase = createSupabaseServerClient();
    const baseUrl = process.env["PUBLIC_BASE_URL"] ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${baseUrl}/auth/callback` },
    });
    if (error || !data.url) {
      throw new Error(error?.message ?? "Failed to create OAuth URL");
    }
    throw redirect({ href: data.url });
  });

/**
 * Signs the current user out and redirects to /.
 */
export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  throw redirect({ to: "/" });
});

/**
 * Server function wrapper for idempotent profile upsert.
 * Called after OAuth callback to ensure a profile row exists.
 */
export const upsertProfile = createServerFn({ method: "POST" })
  .validator(
    (input: unknown) =>
      input as {
        userId: string;
        email?: string | null;
        name?: string | null;
      },
  )
  .handler(async ({ data }) => {
    await upsertProfileFn(data.userId, data.email ?? null, data.name ?? null);
  });

/**
 * Fetches the authenticated user's profile row.
 */
export const getProfile = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw redirect({ to: "/" });
  }
  const [row] = await db.select().from(profiles).where(eq(profiles.id, user.id));
  if (!row) return null;
  const links = (row.links ?? []) as ProfileLink[];
  return { ...row, links };
});

/**
 * Saves all editable profile fields (name, headline, bio, email, location, links).
 */
export const saveProfile = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as ProfileData)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/" });
    await saveProfileDataFn(user.id, data);
  });

/**
 * Creates a signed upload URL for the user's avatar.
 * Returns the signedUrl (for PUT upload) and the final public URL.
 */
export const createAvatarUploadUrl = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect({ to: "/" });

  const serviceClient = createSupabaseServiceClient();
  const path = `${user.id}/avatar`;
  const { data, error } = await serviceClient.storage
    .from("avatars")
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create upload URL");
  }

  const supabaseUrl = process.env["SUPABASE_URL"]!;
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;

  return { signedUrl: data.signedUrl, publicUrl };
});

/**
 * Updates the authenticated user's photo_url after a successful avatar upload.
 */
export const updatePhotoUrl = createServerFn({ method: "POST" })
  .validator((photoUrl: unknown) => photoUrl as string)
  .handler(async ({ data: photoUrl }) => {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/" });
    await updateProfilePhotoUrlFn(user.id, photoUrl);
    return { photo_url: photoUrl };
  });
