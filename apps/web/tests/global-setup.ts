import { execSync } from "child_process";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "path";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:5433/hagerf_cv_test";

export default async function globalSetup() {
  // Start the test DB container
  console.log("[test setup] Starting Docker Postgres container...");
  execSync(
    "docker compose -f docker-compose.test.yml up -d --wait",
    { cwd: path.resolve(__dirname, "../../.."), stdio: "inherit" },
  );

  // Apply migrations
  console.log("[test setup] Applying Drizzle migrations...");
  const client = postgres(TEST_DB_URL, { max: 1 });
  const db = drizzle(client);
  await migrate(db, {
    migrationsFolder: path.resolve(__dirname, "../drizzle"),
  });
  await client.end();
  console.log("[test setup] Migrations applied.");

  // Store the DB URL for tests
  process.env["TEST_DATABASE_URL"] = TEST_DB_URL;
}
