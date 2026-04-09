import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { createSupabaseServerClient } from "../lib/supabase.js";
import {
  listWorkExperiences,
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  reorderWorkExperiences,
  listEducation,
  createEducation,
  updateEducation,
  deleteEducation,
  reorderEducation,
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  type WorkExperienceInput,
  type EducationInput,
  type SkillInput,
  type ProjectInput,
} from "./content.js";

async function requireUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw redirect({ to: "/" });
  return user;
}

// ---------------------------------------------------------------------------
// Work Experiences
// ---------------------------------------------------------------------------

export const getWorkExperiences = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return listWorkExperiences(user.id);
});

export const addWorkExperience = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as WorkExperienceInput)
  .handler(async ({ data }) => {
    const user = await requireUser();
    return createWorkExperience(user.id, data);
  });

export const editWorkExperience = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string } & WorkExperienceInput)
  .handler(async ({ data: { id, ...fields } }) => {
    const user = await requireUser();
    return updateWorkExperience(user.id, id, fields);
  });

export const removeWorkExperience = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await deleteWorkExperience(user.id, id);
  });

export const reorderWorkExperiencesFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { orderedIds: string[] })
  .handler(async ({ data: { orderedIds } }) => {
    const user = await requireUser();
    await reorderWorkExperiences(user.id, orderedIds);
  });

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export const getEducation = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return listEducation(user.id);
});

export const addEducation = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as EducationInput)
  .handler(async ({ data }) => {
    const user = await requireUser();
    return createEducation(user.id, data);
  });

export const editEducation = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string } & EducationInput)
  .handler(async ({ data: { id, ...fields } }) => {
    const user = await requireUser();
    return updateEducation(user.id, id, fields);
  });

export const removeEducation = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await deleteEducation(user.id, id);
  });

export const reorderEducationFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { orderedIds: string[] })
  .handler(async ({ data: { orderedIds } }) => {
    const user = await requireUser();
    await reorderEducation(user.id, orderedIds);
  });

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export const getSkills = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return listSkills(user.id);
});

export const addSkill = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as SkillInput)
  .handler(async ({ data }) => {
    const user = await requireUser();
    return createSkill(user.id, data);
  });

export const editSkill = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string } & SkillInput)
  .handler(async ({ data: { id, ...fields } }) => {
    const user = await requireUser();
    return updateSkill(user.id, id, fields);
  });

export const removeSkill = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await deleteSkill(user.id, id);
  });

export const reorderSkillsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { orderedIds: string[] })
  .handler(async ({ data: { orderedIds } }) => {
    const user = await requireUser();
    await reorderSkills(user.id, orderedIds);
  });

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const getProjects = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireUser();
  return listProjects(user.id);
});

export const addProject = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as ProjectInput)
  .handler(async ({ data }) => {
    const user = await requireUser();
    return createProject(user.id, data);
  });

export const editProject = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string } & ProjectInput)
  .handler(async ({ data: { id, ...fields } }) => {
    const user = await requireUser();
    return updateProject(user.id, id, fields);
  });

export const removeProject = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { id: string })
  .handler(async ({ data: { id } }) => {
    const user = await requireUser();
    await deleteProject(user.id, id);
  });

export const reorderProjectsFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => input as { orderedIds: string[] })
  .handler(async ({ data: { orderedIds } }) => {
    const user = await requireUser();
    await reorderProjects(user.id, orderedIds);
  });
