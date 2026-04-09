import { createFileRoute } from "@tanstack/react-router";
import { signInWithOAuth } from "../../src/server/auth.js";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  async function handleSignIn(provider: "github" | "google") {
    await signInWithOAuth({ data: provider });
  }

  return (
    <main>
      <h1>hagerf-cv</h1>
      <p>A self-hostable CV platform.</p>
      <div>
        <button type="button" onClick={() => handleSignIn("github")}>
          Sign in with GitHub
        </button>
        <button type="button" onClick={() => handleSignIn("google")}>
          Sign in with Google
        </button>
      </div>
    </main>
  );
}
