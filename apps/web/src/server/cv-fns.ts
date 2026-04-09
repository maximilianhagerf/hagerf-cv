import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createSupabaseServerClient } from "../lib/supabase.js";
import { listCVs, createCV, renameCV, deleteCV, duplicateCV } from "./cv.js";

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect({ to: "/" });
  return user;
}

export const getCVs = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return listCVs(user.id);
});

export const createCVFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { label?: string })
  .handler(async ({ data }) => {
    const user = await requireUser();
    return createCV(user.id, data.label);
  });

export const renameCVFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string; label: string })
  .handler(async ({ data: { id, label } }) => {
    const user = await requireUser();
    return renameCV(user.id, id, label);
  });

export const deleteCVFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await deleteCV(user.id, id);
  });

export const duplicateCVFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    return duplicateCV(user.id, id);
  });
