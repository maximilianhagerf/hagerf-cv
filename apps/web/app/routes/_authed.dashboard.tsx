import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { signOut } from "../../src/server/auth.js";

export const Route = createFileRoute("/_authed/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useRouteContext({ from: "/_authed" });

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault();
    await signOut();
  }

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {user.email ?? user.id}</p>
      <form onSubmit={handleSignOut}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
