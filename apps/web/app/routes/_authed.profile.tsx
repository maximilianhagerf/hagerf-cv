import { createFileRoute, useRouteContext } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useRouteContext({ from: "/_authed" });

  return (
    <main>
      <h1>Profile</h1>
      <p>User: {user.email ?? user.id}</p>
      <p>Profile management coming soon.</p>
    </main>
  );
}
