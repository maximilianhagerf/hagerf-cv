import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema.js";
import {
  work_experiences,
  education,
  skills,
  projects,
} from "../db/schema.js";
import { db as defaultDb } from "../db/index.js";
import { eq, and, asc } from "drizzle-orm";

type AnyDb = PostgresJsDatabase<typeof schema>;

// ---------------------------------------------------------------------------
// Row types (with jsonb columns typed for serialization)
// ---------------------------------------------------------------------------

export type WorkRow = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  bullets: string[];
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export type EduRow = {
  id: string;
  user_id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export type SkillRow = {
  id: string;
  user_id: string;
  category: string;
  items: string[];
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export type ProjectRow = {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  description: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export type WorkExperienceInput = {
  company: string;
  role: string;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  bullets?: string[];
};

export type EducationInput = {
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type SkillInput = {
  category: string;
  items?: string[];
};

export type ProjectInput = {
  title: string;
  url?: string | null;
  description?: string | null;
};

// ---------------------------------------------------------------------------
// Work Experiences
// ---------------------------------------------------------------------------

export async function listWorkExperiences(
  userId: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<WorkRow[]> {
  const rows = await dbInstance
    .select()
    .from(work_experiences)
    .where(eq(work_experiences.user_id, userId))
    .orderBy(asc(work_experiences.sort_order));
  return rows as unknown as WorkRow[];
}

export async function createWorkExperience(
  userId: string,
  input: WorkExperienceInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<WorkRow> {
  // next sort_order = count of existing rows
  const existing = await dbInstance
    .select({ id: work_experiences.id })
    .from(work_experiences)
    .where(eq(work_experiences.user_id, userId));
  const sort_order = existing.length;

  const [row] = await dbInstance
    .insert(work_experiences)
    .values({
      user_id: userId,
      company: input.company,
      role: input.role,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      description: input.description ?? null,
      bullets: (input.bullets ?? []) as unknown as string[],
      sort_order,
    })
    .returning();
  return row! as unknown as WorkRow;
}

export async function updateWorkExperience(
  userId: string,
  id: string,
  input: WorkExperienceInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<WorkRow | null> {
  const [row] = await dbInstance
    .update(work_experiences)
    .set({
      company: input.company,
      role: input.role,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      description: input.description ?? null,
      bullets: (input.bullets ?? []) as unknown as string[],
      updated_at: new Date(),
    })
    .where(and(eq(work_experiences.id, id), eq(work_experiences.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as WorkRow | null;
}

export async function deleteWorkExperience(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await dbInstance
    .delete(work_experiences)
    .where(and(eq(work_experiences.id, id), eq(work_experiences.user_id, userId)));
}

export async function reorderWorkExperiences(
  userId: string,
  orderedIds: string[],
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      dbInstance
        .update(work_experiences)
        .set({ sort_order: index, updated_at: new Date() })
        .where(and(eq(work_experiences.id, id), eq(work_experiences.user_id, userId))),
    ),
  );
}

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export async function listEducation(
  userId: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<EduRow[]> {
  const rows = await dbInstance
    .select()
    .from(education)
    .where(eq(education.user_id, userId))
    .orderBy(asc(education.sort_order));
  return rows as unknown as EduRow[];
}

export async function createEducation(
  userId: string,
  input: EducationInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<EduRow> {
  const existing = await dbInstance
    .select({ id: education.id })
    .from(education)
    .where(eq(education.user_id, userId));
  const sort_order = existing.length;

  const [row] = await dbInstance
    .insert(education)
    .values({
      user_id: userId,
      institution: input.institution,
      degree: input.degree ?? null,
      field_of_study: input.field_of_study ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      sort_order,
    })
    .returning();
  return row! as unknown as EduRow;
}

export async function updateEducation(
  userId: string,
  id: string,
  input: EducationInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<EduRow | null> {
  const [row] = await dbInstance
    .update(education)
    .set({
      institution: input.institution,
      degree: input.degree ?? null,
      field_of_study: input.field_of_study ?? null,
      start_date: input.start_date ?? null,
      end_date: input.end_date ?? null,
      updated_at: new Date(),
    })
    .where(and(eq(education.id, id), eq(education.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as EduRow | null;
}

export async function deleteEducation(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await dbInstance
    .delete(education)
    .where(and(eq(education.id, id), eq(education.user_id, userId)));
}

export async function reorderEducation(
  userId: string,
  orderedIds: string[],
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      dbInstance
        .update(education)
        .set({ sort_order: index, updated_at: new Date() })
        .where(and(eq(education.id, id), eq(education.user_id, userId))),
    ),
  );
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export async function listSkills(
  userId: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<SkillRow[]> {
  const rows = await dbInstance
    .select()
    .from(skills)
    .where(eq(skills.user_id, userId))
    .orderBy(asc(skills.sort_order));
  return rows as unknown as SkillRow[];
}

export async function createSkill(
  userId: string,
  input: SkillInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<SkillRow> {
  const existing = await dbInstance
    .select({ id: skills.id })
    .from(skills)
    .where(eq(skills.user_id, userId));
  const sort_order = existing.length;

  const [row] = await dbInstance
    .insert(skills)
    .values({
      user_id: userId,
      category: input.category,
      items: (input.items ?? []) as unknown as string[],
      sort_order,
    })
    .returning();
  return row! as unknown as SkillRow;
}

export async function updateSkill(
  userId: string,
  id: string,
  input: SkillInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<SkillRow | null> {
  const [row] = await dbInstance
    .update(skills)
    .set({
      category: input.category,
      items: (input.items ?? []) as unknown as string[],
      updated_at: new Date(),
    })
    .where(and(eq(skills.id, id), eq(skills.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as SkillRow | null;
}

export async function deleteSkill(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await dbInstance
    .delete(skills)
    .where(and(eq(skills.id, id), eq(skills.user_id, userId)));
}

export async function reorderSkills(
  userId: string,
  orderedIds: string[],
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      dbInstance
        .update(skills)
        .set({ sort_order: index, updated_at: new Date() })
        .where(and(eq(skills.id, id), eq(skills.user_id, userId))),
    ),
  );
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function listProjects(
  userId: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<ProjectRow[]> {
  const rows = await dbInstance
    .select()
    .from(projects)
    .where(eq(projects.user_id, userId))
    .orderBy(asc(projects.sort_order));
  return rows as unknown as ProjectRow[];
}

export async function createProject(
  userId: string,
  input: ProjectInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<ProjectRow> {
  const existing = await dbInstance
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.user_id, userId));
  const sort_order = existing.length;

  const [row] = await dbInstance
    .insert(projects)
    .values({
      user_id: userId,
      title: input.title,
      url: input.url ?? null,
      description: input.description ?? null,
      sort_order,
    })
    .returning();
  return row! as unknown as ProjectRow;
}

export async function updateProject(
  userId: string,
  id: string,
  input: ProjectInput,
  dbInstance: AnyDb = defaultDb as AnyDb,
): Promise<ProjectRow | null> {
  const [row] = await dbInstance
    .update(projects)
    .set({
      title: input.title,
      url: input.url ?? null,
      description: input.description ?? null,
      updated_at: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.user_id, userId)))
    .returning();
  return (row ?? null) as unknown as ProjectRow | null;
}

export async function deleteProject(
  userId: string,
  id: string,
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await dbInstance
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.user_id, userId)));
}

export async function reorderProjects(
  userId: string,
  orderedIds: string[],
  dbInstance: AnyDb = defaultDb as AnyDb,
) {
  await Promise.all(
    orderedIds.map((id, index) =>
      dbInstance
        .update(projects)
        .set({ sort_order: index, updated_at: new Date() })
        .where(and(eq(projects.id, id), eq(projects.user_id, userId))),
    ),
  );
}
