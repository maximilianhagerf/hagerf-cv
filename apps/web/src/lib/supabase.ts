import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import { setCookie, getRequestHeader } from "@tanstack/react-start/server";

function getSupabaseEnv() {
  const url = process.env["SUPABASE_URL"];
  const anonKey = process.env["SUPABASE_ANON_KEY"];
  if (!url || !anonKey) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  }
  return { url, anonKey };
}

/** Create a Supabase server client that reads/writes cookies via TanStack Start's h3 helpers. */
export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        const cookieHeader = getRequestHeader("cookie") ?? "";
        return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options);
        }
      },
    },
  });
}

/** Create a Supabase server client with the service-role key (bypasses RLS). Only use server-side. */
export function createSupabaseServiceClient() {
  const url = process.env["SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }

  return createServerClient(url, serviceKey, {
    auth: { persistSession: false },
    cookies: {
      getAll() {
        const cookieHeader = getRequestHeader("cookie") ?? "";
        return parseCookieHeader(cookieHeader).map(({ name, value }) => ({
          name,
          value: value ?? "",
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options);
        }
      },
    },
  });
}
