import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema.js";
import { cv_documents } from "../db/schema.js";
import { db as defaultDb } from "../db/index.js";
import { eq, and, count, desc } from "drizzle-orm";

type AnyDb = PostgresJsDatabase<typeof schema>;

export const CV_DOCUMENT_LIMIT = 10;

export type CVDocumentRow = {
  id: string;
  user_id: string;
  label: string;
  share_token: string;
  is_public: boolean;
  format: string;
  theme: string;
  summary_override: string | null;
  sections_config: object;
  created_at: Date;
  updated_at: Date;
};

export type CreateCVError = { error: string };

function isCreateCVError(v: CVDocumentRow | CreateCVError): v is CreateCVError {
  return "error" in v;
}
export { isCreateCVError };

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listCVs(
  userId: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow[]> {
  const rows = await dbInstance
    .select()
    .from(cv_documents)
    .where(eq(cv_documents.user_id, userId))
    .orderBy(desc(cv_documents.updated_at));
  return rows as unknown as CVDocumentRow[];
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createCV(
  userId: string,
  label = "My CV",
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow | CreateCVError> {
  const [result] = await dbInstance
    .select({ cnt: count() })
    .from(cv_documents)
    .where(eq(cv_documents.user_id, userId));

  if ((result?.cnt ?? 0) >= CV_DOCUMENT_LIMIT) {
    return {
      error: `You have reached the limit of ${CV_DOCUMENT_LIMIT} CV documents. Delete one to create a new one.`,
    };
  }

  const share_token = crypto.randomUUID();
  const [row] = await dbInstance
    .insert(cv_documents)
    .values({ user_id: userId, label, share_token })
    .returning();
  return row! as unknown as CVDocumentRow;
}

// ---------------------------------------------------------------------------
// Rename
// ---------------------------------------------------------------------------

export async function renameCV(
  userId: string,
  id: string,
  label: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow | null> {
  const [row] = await dbInstance
    .update(cv_documents)
    .set({ label, updated_at: new Date() })
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as CVDocumentRow | null;
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export async function deleteCV(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<void> {
  await dbInstance
    .delete(cv_documents)
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)));
}

// ---------------------------------------------------------------------------
// Duplicate
// ---------------------------------------------------------------------------

export async function duplicateCV(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow | CreateCVError> {
  const [result] = await dbInstance
    .select({ cnt: count() })
    .from(cv_documents)
    .where(eq(cv_documents.user_id, userId));

  if ((result?.cnt ?? 0) >= CV_DOCUMENT_LIMIT) {
    return {
      error: `You have reached the limit of ${CV_DOCUMENT_LIMIT} CV documents. Delete one to duplicate.`,
    };
  }

  const [source] = await dbInstance
    .select()
    .from(cv_documents)
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)));

  if (!source) return { error: "CV document not found." };

  const share_token = crypto.randomUUID();
  const [row] = await dbInstance
    .insert(cv_documents)
    .values({
      user_id: userId,
      label: `Copy of ${source.label}`,
      share_token,
      format: source.format,
      theme: source.theme,
      sections_config: source.sections_config,
      summary_override: source.summary_override,
    })
    .returning();
  return row! as unknown as CVDocumentRow;
}
