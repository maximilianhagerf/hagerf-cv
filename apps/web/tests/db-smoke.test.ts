import { describe, it, expect, afterAll } from "@jest/globals";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

const EXPECTED_TABLES = [
  "profiles",
  "work_experiences",
  "education",
  "skills",
  "projects",
  "cv_documents",
  "cv_views",
];

describe("Database smoke tests", () => {
  const TEST_DB_URL =
    process.env["TEST_DATABASE_URL"] ??
    "postgresql://postgres:postgres@localhost:5433/hagerf_cv_test";

  const client = postgres(TEST_DB_URL);
  const db = drizzle(client);

  afterAll(async () => {
    await client.end();
  });

  it("connects to the test database", async () => {
    const result = await db.execute(sql`SELECT 1 AS ok`);
    expect(result[0]).toEqual({ ok: 1 });
  });

  it.each(EXPECTED_TABLES)("table %s exists after migration", async (tableName) => {
    const result = await db.execute(
      sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
      `,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ table_name: tableName });
  });

  it("cv_views has no PII columns", async () => {
    const result = await db.execute(
      sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cv_views'
        ORDER BY ordinal_position
      `,
    );
    const columns = result.map((r) => (r as { column_name: string }).column_name);
    expect(columns).toEqual(["id", "cv_document_id", "viewed_at"]);
  });

  it.each(["work_experiences", "education", "skills", "projects"])(
    "table %s has sort_order column",
    async (tableName) => {
      const result = await db.execute(
        sql`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = ${tableName}
            AND column_name = 'sort_order'
        `,
      );
      expect(result).toHaveLength(1);
    },
  );

  it("cv_documents has sections_config jsonb column", async () => {
    const result = await db.execute(
      sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cv_documents'
          AND column_name = 'sections_config'
      `,
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ column_name: "sections_config", data_type: "jsonb" });
  });

  it("cv_documents has per-user max-10 trigger", async () => {
    const result = await db.execute(
      sql`
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'public'
          AND event_object_table = 'cv_documents'
          AND trigger_name = 'cv_documents_per_user_max_10'
      `,
    );
    expect(result).toHaveLength(1);
  });
});
