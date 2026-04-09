import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createSupabaseServerClient } from "../lib/supabase.js";
import { db, profiles } from "../db/index.js";
import { eq } from "drizzle-orm";
import { upsertProfile as upsertProfileFn } from "./profile.js";

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
  // jsonb columns have type `unknown`; cast to JSON-serializable for TanStack Start serialization
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  const links = (row.links ?? null) as Record<string, {}> | null;
  return { ...row, links };
});
