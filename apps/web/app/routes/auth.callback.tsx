import { createFileRoute, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createSupabaseServerClient } from "../../src/lib/supabase.js";
import { upsertProfile } from "../../src/server/profile.js";

/**
 * Exchanges the OAuth authorization code for a Supabase session.
 * Sets session cookies via the SSR-compatible Supabase client.
 * Creates the profile row if this is the user's first login.
 */
const exchangeCode = createServerFn({ method: "POST" })
  .validator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(data.code);
    if (error) {
      return { ok: false } as const;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await upsertProfile(user.id, user.email ?? null);
    }
    return { ok: true } as const;
  });

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async ({ search }) => {
    const code = (search as Record<string, string | undefined>)["code"];
    if (!code) throw redirect({ to: "/" });

    const result = await exchangeCode({ data: { code } });
    if (!result.ok) throw redirect({ to: "/" });

    throw redirect({ to: "/dashboard" });
  },
  component: () => <div>Signing in&hellip;</div>,
});
