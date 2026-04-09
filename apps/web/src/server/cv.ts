import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema.js";
import { cv_documents, cv_views, profiles, work_experiences, education, skills, projects } from "../db/schema.js";
import { db as defaultDb } from "../db/index.js";
import { eq, and, count, desc, asc, inArray } from "drizzle-orm";
import { type } from "arktype";
import { SectionConfig } from "@hagerf-cv/renderer";
import type { SectionConfigType, WorkEntryType, EducationEntryType, SkillEntryType, ProjectEntryType, CVProfileType, CVDataType } from "@hagerf-cv/renderer";
import { nanoid } from "nanoid";

// ---------------------------------------------------------------------------
// sections_config helpers
// ---------------------------------------------------------------------------

const ALL_SECTION_TYPES = ["summary", "work", "education", "skills", "projects", "links"] as const;
type KnownSectionType = (typeof ALL_SECTION_TYPES)[number];

const SectionConfigArray = SectionConfig.array();

export function defaultSectionsConfig(): SectionConfigType[] {
  return ALL_SECTION_TYPES.map((t) => ({ type: t, visible: true }));
}

/**
 * Validate and normalise a raw sections_config value from the database.
 * Returns validated array, filling in missing section types.
 * Throws a typed error if the value is fundamentally invalid (not an array).
 */
export function parseSectionsConfig(raw: unknown): SectionConfigType[] {
  if (!Array.isArray(raw)) return defaultSectionsConfig();
  const result = SectionConfigArray(raw);
  if (result instanceof type.errors) {
    // Surface as a typed error so callers can handle it
    throw new Error(`Invalid sections_config: ${result.summary}`);
  }
  // Fill in any missing section types at the end (hidden by default)
  const present = new Set(result.map((s: SectionConfigType) => s.type as KnownSectionType));
  const missing = ALL_SECTION_TYPES.filter((t) => !present.has(t));
  return [
    ...result,
    ...missing.map((t) => ({ type: t, visible: false })),
  ];
}

/**
 * Validate sections_config before writing to the database.
 * Throws if the value doesn't conform to the schema.
 */
export function validateSectionsConfig(raw: unknown): SectionConfigType[] {
  const result = SectionConfigArray(raw);
  if (result instanceof type.errors) {
    throw new Error(`Invalid sections_config: ${result.summary}`);
  }
  return result;
}

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
  view_count?: number;
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

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const viewCounts = await dbInstance
    .select({ cv_document_id: cv_views.cv_document_id, cnt: count() })
    .from(cv_views)
    .where(inArray(cv_views.cv_document_id, ids))
    .groupBy(cv_views.cv_document_id);

  const countMap = new Map<string, number>();
  for (const vc of viewCounts) {
    countMap.set(vc.cv_document_id, Number(vc.cnt));
  }

  return rows.map((row) => ({
    ...(row as unknown as CVDocumentRow),
    view_count: countMap.get(row.id) ?? 0,
  }));
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

  const share_token = nanoid();
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

  const share_token = nanoid();
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

// ---------------------------------------------------------------------------
// Get (single CV + associated content for editor)
// ---------------------------------------------------------------------------

export type CVEditorData = {
  cv: CVDocumentRow;
  sections_config: SectionConfigType[];
  profile: CVProfileType;
  work: WorkEntryType[];
  education: EducationEntryType[];
  skills: SkillEntryType[];
  projects: ProjectEntryType[];
  view_count: number;
};

export async function getCV(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVEditorData | null> {
  const [cv] = await dbInstance
    .select()
    .from(cv_documents)
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)));

  if (!cv) return null;

  const [profileRow] = await dbInstance
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId));

  const [workRows, eduRows, skillRows, projRows] = await Promise.all([
    dbInstance.select().from(work_experiences).where(eq(work_experiences.user_id, userId)).orderBy(asc(work_experiences.sort_order)),
    dbInstance.select().from(education).where(eq(education.user_id, userId)).orderBy(asc(education.sort_order)),
    dbInstance.select().from(skills).where(eq(skills.user_id, userId)).orderBy(asc(skills.sort_order)),
    dbInstance.select().from(projects).where(eq(projects.user_id, userId)).orderBy(asc(projects.sort_order)),
  ]);

  const [viewCountResult] = await dbInstance
    .select({ cnt: count() })
    .from(cv_views)
    .where(eq(cv_views.cv_document_id, cv.id));

  const sections_config = parseSectionsConfig(cv.sections_config);

  const profile: CVProfileType = profileRow
    ? {
        ...(profileRow.name != null && { name: profileRow.name }),
        ...(profileRow.headline != null && { headline: profileRow.headline }),
        ...(profileRow.bio != null && { bio: profileRow.bio }),
        ...(profileRow.email != null && { email: profileRow.email }),
        ...(profileRow.location != null && { location: profileRow.location }),
        ...(profileRow.photo_url != null && { photo_url: profileRow.photo_url }),
        links: (profileRow.links as CVProfileType["links"]) ?? [],
      }
    : {};

  return {
    cv: cv as unknown as CVDocumentRow,
    sections_config,
    profile,
    work: workRows as unknown as WorkEntryType[],
    education: eduRows as unknown as EducationEntryType[],
    skills: skillRows as unknown as SkillEntryType[],
    projects: projRows as unknown as ProjectEntryType[],
    view_count: Number(viewCountResult?.cnt ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Update CV config (theme, format, summary_override, sections_config)
// ---------------------------------------------------------------------------

export type CVConfigInput = {
  theme?: string;
  format?: string;
  summary_override?: string | null;
  sections_config?: SectionConfigType[];
};

export async function updateCVConfig(
  userId: string,
  id: string,
  input: CVConfigInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow | null> {
  // Validate sections_config if provided
  if (input.sections_config !== undefined) {
    validateSectionsConfig(input.sections_config);
  }

  const [row] = await dbInstance
    .update(cv_documents)
    .set({
      ...(input.theme !== undefined && { theme: input.theme }),
      ...(input.format !== undefined && { format: input.format }),
      ...("summary_override" in input && { summary_override: input.summary_override }),
      ...(input.sections_config !== undefined && {
        sections_config: input.sections_config as unknown as object,
      }),
      updated_at: new Date(),
    })
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as CVDocumentRow | null;
}

// ---------------------------------------------------------------------------
// Toggle public/private
// ---------------------------------------------------------------------------

export async function toggleCVPublic(
  userId: string,
  id: string,
  isPublic: boolean,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow | null> {
  const [row] = await dbInstance
    .update(cv_documents)
    .set({ is_public: isPublic, updated_at: new Date() })
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as CVDocumentRow | null;
}

// ---------------------------------------------------------------------------
// Regenerate share token
// ---------------------------------------------------------------------------

export async function regenerateShareToken(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDocumentRow | null> {
  const newToken = nanoid();
  const [row] = await dbInstance
    .update(cv_documents)
    .set({ share_token: newToken, updated_at: new Date() })
    .where(and(eq(cv_documents.id, id), eq(cv_documents.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as CVDocumentRow | null;
}

// ---------------------------------------------------------------------------
// Get public CV by share token (unauthenticated)
// ---------------------------------------------------------------------------

export async function getPublicCV(
  token: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<CVDataType | null> {
  const [cv] = await dbInstance
    .select()
    .from(cv_documents)
    .where(and(eq(cv_documents.share_token, token), eq(cv_documents.is_public, true)));

  if (!cv) return null;

  // Record anonymous view — no PII stored
  await dbInstance.insert(cv_views).values({ cv_document_id: cv.id });

  const [profileRow] = await dbInstance
    .select()
    .from(profiles)
    .where(eq(profiles.id, cv.user_id));

  const [workRows, eduRows, skillRows, projRows] = await Promise.all([
    dbInstance.select().from(work_experiences).where(eq(work_experiences.user_id, cv.user_id)).orderBy(asc(work_experiences.sort_order)),
    dbInstance.select().from(education).where(eq(education.user_id, cv.user_id)).orderBy(asc(education.sort_order)),
    dbInstance.select().from(skills).where(eq(skills.user_id, cv.user_id)).orderBy(asc(skills.sort_order)),
    dbInstance.select().from(projects).where(eq(projects.user_id, cv.user_id)).orderBy(asc(projects.sort_order)),
  ]);

  const sections_config = parseSectionsConfig(cv.sections_config);

  const profile: CVProfileType = profileRow
    ? {
        ...(profileRow.name != null && { name: profileRow.name }),
        ...(profileRow.headline != null && { headline: profileRow.headline }),
        ...(profileRow.bio != null && { bio: profileRow.bio }),
        ...(profileRow.email != null && { email: profileRow.email }),
        ...(profileRow.location != null && { location: profileRow.location }),
        ...(profileRow.photo_url != null && { photo_url: profileRow.photo_url }),
        links: (profileRow.links as CVProfileType["links"]) ?? [],
      }
    : {};

  return {
    id: cv.id,
    label: cv.label,
    format: (cv.format === "letter" ? "letter" : "a4") as "a4" | "letter",
    theme: (cv.theme === "compact" ? "compact" : "minimal") as "minimal" | "compact",
    summary_override: (cv as unknown as CVDocumentRow).summary_override ?? null,
    sections_config,
    profile,
    work: workRows as unknown as WorkEntryType[],
    education: eduRows as unknown as EducationEntryType[],
    skills: skillRows as unknown as SkillEntryType[],
    projects: projRows as unknown as ProjectEntryType[],
  };
}

// ---------------------------------------------------------------------------
// Get view count for a CV document
// ---------------------------------------------------------------------------

export async function getCVViewCount(
  cvDocumentId: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<number> {
  const [result] = await dbInstance
    .select({ cnt: count() })
    .from(cv_views)
    .where(eq(cv_views.cv_document_id, cvDocumentId));
  return Number(result?.cnt ?? 0);
}
