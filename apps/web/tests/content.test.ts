import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema.js";
import { upsertProfile } from "../src/server/profile.js";
import {
  createWorkExperience,
  updateWorkExperience,
  deleteWorkExperience,
  reorderWorkExperiences,
  listWorkExperiences,
  createEducation,
  updateEducation,
  deleteEducation,
  reorderEducation,
  listEducation,
  createSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  listSkills,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  listProjects,
} from "../src/server/content.js";

const TEST_DB_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5433/hagerf_cv_test";

const client = postgres(TEST_DB_URL);
const db = drizzle(client, { schema });

afterAll(async () => {
  await client.end();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function makeUser(db: ReturnType<typeof drizzle<typeof schema>>) {
  const userId = crypto.randomUUID();
  await upsertProfile(
    userId,
    `${userId}@test.example`,
    null,
    db as Parameters<typeof upsertProfile>[3],
  );
  return userId;
}

// ---------------------------------------------------------------------------
// Work Experiences
// ---------------------------------------------------------------------------

describe("work_experiences CRUD", () => {
  it("creates a work experience entry", async () => {
    const userId = await makeUser(db);

    const row = await createWorkExperience(
      userId,
      {
        company: "Acme Corp",
        role: "Software Engineer",
        start_date: "2020-01",
        end_date: null,
        description: "Built stuff",
        bullets: ["Did X", "Did Y"],
      },
      db as Parameters<typeof createWorkExperience>[2],
    );

    expect(row.company).toBe("Acme Corp");
    expect(row.role).toBe("Software Engineer");
    expect(row.end_date).toBeNull();
    expect(row.bullets).toEqual(["Did X", "Did Y"]);
    expect(row.sort_order).toBe(0);
  });

  it("updates a work experience entry", async () => {
    const userId = await makeUser(db);
    const created = await createWorkExperience(
      userId,
      { company: "Old Co", role: "Dev" },
      db as Parameters<typeof createWorkExperience>[2],
    );

    const updated = await updateWorkExperience(
      userId,
      created.id,
      { company: "New Co", role: "Senior Dev", end_date: "2023-06" },
      db as Parameters<typeof updateWorkExperience>[3],
    );

    expect(updated?.company).toBe("New Co");
    expect(updated?.role).toBe("Senior Dev");
    expect(updated?.end_date).toBe("2023-06");
  });

  it("deletes a work experience entry", async () => {
    const userId = await makeUser(db);
    const created = await createWorkExperience(
      userId,
      { company: "Del Co", role: "Dev" },
      db as Parameters<typeof createWorkExperience>[2],
    );

    await deleteWorkExperience(
      userId,
      created.id,
      db as Parameters<typeof deleteWorkExperience>[2],
    );

    const rows = await db
      .select()
      .from(schema.work_experiences)
      .where(eq(schema.work_experiences.id, created.id));
    expect(rows).toHaveLength(0);
  });

  it("reorders work experience entries — sort_order persists correctly", async () => {
    const userId = await makeUser(db);
    const a = await createWorkExperience(
      userId,
      { company: "A", role: "Role A" },
      db as Parameters<typeof createWorkExperience>[2],
    );
    const b = await createWorkExperience(
      userId,
      { company: "B", role: "Role B" },
      db as Parameters<typeof createWorkExperience>[2],
    );
    const c = await createWorkExperience(
      userId,
      { company: "C", role: "Role C" },
      db as Parameters<typeof createWorkExperience>[2],
    );

    // Reverse order: C, A, B
    await reorderWorkExperiences(
      userId,
      [c.id, a.id, b.id],
      db as Parameters<typeof reorderWorkExperiences>[2],
    );

    const list = await listWorkExperiences(
      userId,
      db as Parameters<typeof listWorkExperiences>[1],
    );
    expect(list.map((r) => r.company)).toEqual(["C", "A", "B"]);
    expect(list[0]?.sort_order).toBe(0);
    expect(list[1]?.sort_order).toBe(1);
    expect(list[2]?.sort_order).toBe(2);
  });

  it("user cannot mutate another user's work experience (RLS)", async () => {
    const userA = await makeUser(db);
    const userB = await makeUser(db);

    const row = await createWorkExperience(
      userA,
      { company: "A Corp", role: "Engineer" },
      db as Parameters<typeof createWorkExperience>[2],
    );

    // userB tries to update userA's entry
    const result = await updateWorkExperience(
      userB,
      row.id,
      { company: "Hacked", role: "Hacked" },
      db as Parameters<typeof updateWorkExperience>[3],
    );
    expect(result).toBeNull();

    // Verify original is intact
    const orig = await db
      .select()
      .from(schema.work_experiences)
      .where(eq(schema.work_experiences.id, row.id));
    expect(orig[0]?.company).toBe("A Corp");
  });
});

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

describe("education CRUD", () => {
  it("creates an education entry", async () => {
    const userId = await makeUser(db);
    const row = await createEducation(
      userId,
      {
        institution: "MIT",
        degree: "B.Sc.",
        field_of_study: "Computer Science",
        start_date: "2016-09",
        end_date: "2020-06",
      },
      db as Parameters<typeof createEducation>[2],
    );

    expect(row.institution).toBe("MIT");
    expect(row.degree).toBe("B.Sc.");
    expect(row.field_of_study).toBe("Computer Science");
    expect(row.sort_order).toBe(0);
  });

  it("updates an education entry", async () => {
    const userId = await makeUser(db);
    const created = await createEducation(
      userId,
      { institution: "Old Uni" },
      db as Parameters<typeof createEducation>[2],
    );

    const updated = await updateEducation(
      userId,
      created.id,
      { institution: "New Uni", degree: "M.Sc." },
      db as Parameters<typeof updateEducation>[3],
    );

    expect(updated?.institution).toBe("New Uni");
    expect(updated?.degree).toBe("M.Sc.");
  });

  it("deletes an education entry", async () => {
    const userId = await makeUser(db);
    const created = await createEducation(
      userId,
      { institution: "Del Uni" },
      db as Parameters<typeof createEducation>[2],
    );

    await deleteEducation(
      userId,
      created.id,
      db as Parameters<typeof deleteEducation>[2],
    );

    const rows = await db
      .select()
      .from(schema.education)
      .where(eq(schema.education.id, created.id));
    expect(rows).toHaveLength(0);
  });

  it("reorders education entries — sort_order persists correctly", async () => {
    const userId = await makeUser(db);
    const a = await createEducation(
      userId,
      { institution: "Uni A" },
      db as Parameters<typeof createEducation>[2],
    );
    const b = await createEducation(
      userId,
      { institution: "Uni B" },
      db as Parameters<typeof createEducation>[2],
    );

    await reorderEducation(
      userId,
      [b.id, a.id],
      db as Parameters<typeof reorderEducation>[2],
    );

    const list = await listEducation(
      userId,
      db as Parameters<typeof listEducation>[1],
    );
    expect(list.map((r) => r.institution)).toEqual(["Uni B", "Uni A"]);
  });

  it("user cannot mutate another user's education (RLS)", async () => {
    const userA = await makeUser(db);
    const userB = await makeUser(db);

    const row = await createEducation(
      userA,
      { institution: "A Uni" },
      db as Parameters<typeof createEducation>[2],
    );

    const result = await updateEducation(
      userB,
      row.id,
      { institution: "Hacked Uni" },
      db as Parameters<typeof updateEducation>[3],
    );
    expect(result).toBeNull();

    const orig = await db
      .select()
      .from(schema.education)
      .where(eq(schema.education.id, row.id));
    expect(orig[0]?.institution).toBe("A Uni");
  });
});

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

describe("skills CRUD", () => {
  it("creates a skill category with items", async () => {
    const userId = await makeUser(db);
    const row = await createSkill(
      userId,
      { category: "Languages", items: ["TypeScript", "Go", "Rust"] },
      db as Parameters<typeof createSkill>[2],
    );

    expect(row.category).toBe("Languages");
    expect(row.items).toEqual(["TypeScript", "Go", "Rust"]);
    expect(row.sort_order).toBe(0);
  });

  it("updates a skill category", async () => {
    const userId = await makeUser(db);
    const created = await createSkill(
      userId,
      { category: "Old Category", items: ["A"] },
      db as Parameters<typeof createSkill>[2],
    );

    const updated = await updateSkill(
      userId,
      created.id,
      { category: "New Category", items: ["A", "B", "C"] },
      db as Parameters<typeof updateSkill>[3],
    );

    expect(updated?.category).toBe("New Category");
    expect(updated?.items).toEqual(["A", "B", "C"]);
  });

  it("deletes a skill category", async () => {
    const userId = await makeUser(db);
    const created = await createSkill(
      userId,
      { category: "Tools" },
      db as Parameters<typeof createSkill>[2],
    );

    await deleteSkill(
      userId,
      created.id,
      db as Parameters<typeof deleteSkill>[2],
    );

    const rows = await db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.id, created.id));
    expect(rows).toHaveLength(0);
  });

  it("reorders skill categories — sort_order persists correctly", async () => {
    const userId = await makeUser(db);
    const a = await createSkill(
      userId,
      { category: "Cat A" },
      db as Parameters<typeof createSkill>[2],
    );
    const b = await createSkill(
      userId,
      { category: "Cat B" },
      db as Parameters<typeof createSkill>[2],
    );
    const c = await createSkill(
      userId,
      { category: "Cat C" },
      db as Parameters<typeof createSkill>[2],
    );

    await reorderSkills(
      userId,
      [b.id, c.id, a.id],
      db as Parameters<typeof reorderSkills>[2],
    );

    const list = await listSkills(
      userId,
      db as Parameters<typeof listSkills>[1],
    );
    expect(list.map((r) => r.category)).toEqual(["Cat B", "Cat C", "Cat A"]);
  });

  it("user cannot mutate another user's skill (RLS)", async () => {
    const userA = await makeUser(db);
    const userB = await makeUser(db);

    const row = await createSkill(
      userA,
      { category: "A Skills" },
      db as Parameters<typeof createSkill>[2],
    );

    const result = await updateSkill(
      userB,
      row.id,
      { category: "Hacked" },
      db as Parameters<typeof updateSkill>[3],
    );
    expect(result).toBeNull();

    const orig = await db
      .select()
      .from(schema.skills)
      .where(eq(schema.skills.id, row.id));
    expect(orig[0]?.category).toBe("A Skills");
  });
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

describe("projects CRUD", () => {
  it("creates a project entry", async () => {
    const userId = await makeUser(db);
    const row = await createProject(
      userId,
      {
        title: "hagerf-cv",
        url: "https://github.com/maximilianhagerf/hagerf-cv",
        description: "A CV platform",
      },
      db as Parameters<typeof createProject>[2],
    );

    expect(row.title).toBe("hagerf-cv");
    expect(row.url).toBe("https://github.com/maximilianhagerf/hagerf-cv");
    expect(row.description).toBe("A CV platform");
    expect(row.sort_order).toBe(0);
  });

  it("updates a project entry", async () => {
    const userId = await makeUser(db);
    const created = await createProject(
      userId,
      { title: "Old Project" },
      db as Parameters<typeof createProject>[2],
    );

    const updated = await updateProject(
      userId,
      created.id,
      { title: "New Project", url: "https://example.com", description: "Updated" },
      db as Parameters<typeof updateProject>[3],
    );

    expect(updated?.title).toBe("New Project");
    expect(updated?.url).toBe("https://example.com");
    expect(updated?.description).toBe("Updated");
  });

  it("deletes a project entry", async () => {
    const userId = await makeUser(db);
    const created = await createProject(
      userId,
      { title: "Del Project" },
      db as Parameters<typeof createProject>[2],
    );

    await deleteProject(
      userId,
      created.id,
      db as Parameters<typeof deleteProject>[2],
    );

    const rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, created.id));
    expect(rows).toHaveLength(0);
  });

  it("reorders projects — sort_order persists correctly", async () => {
    const userId = await makeUser(db);
    const a = await createProject(
      userId,
      { title: "Project A" },
      db as Parameters<typeof createProject>[2],
    );
    const b = await createProject(
      userId,
      { title: "Project B" },
      db as Parameters<typeof createProject>[2],
    );

    await reorderProjects(
      userId,
      [b.id, a.id],
      db as Parameters<typeof reorderProjects>[2],
    );

    const list = await listProjects(
      userId,
      db as Parameters<typeof listProjects>[1],
    );
    expect(list.map((r) => r.title)).toEqual(["Project B", "Project A"]);
    expect(list[0]?.sort_order).toBe(0);
    expect(list[1]?.sort_order).toBe(1);
  });

  it("user cannot mutate another user's project (RLS)", async () => {
    const userA = await makeUser(db);
    const userB = await makeUser(db);

    const row = await createProject(
      userA,
      { title: "A Project" },
      db as Parameters<typeof createProject>[2],
    );

    const result = await updateProject(
      userB,
      row.id,
      { title: "Hacked" },
      db as Parameters<typeof updateProject>[3],
    );
    expect(result).toBeNull();

    const orig = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, row.id));
    expect(orig[0]?.title).toBe("A Project");
  });
});
