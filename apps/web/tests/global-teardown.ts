import { execSync } from "child_process";
import path from "path";

export default async function globalTeardown() {
  console.log("[test teardown] Stopping Docker Postgres container...");
  execSync(
    "docker compose -f docker-compose.test.yml down --volumes",
    { cwd: path.resolve(__dirname, "../../.."), stdio: "inherit" },
  );
  console.log("[test teardown] Docker container stopped.");
}
