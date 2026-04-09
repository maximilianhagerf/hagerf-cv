import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>hagerf-cv</h1>
      <p>A self-hostable CV platform.</p>
    </main>
  );
}
