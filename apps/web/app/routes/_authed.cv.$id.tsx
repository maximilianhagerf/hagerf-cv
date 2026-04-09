import { createFileRoute, useRouteContext } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/cv/$id")({
  component: CvEditor,
});

function CvEditor() {
  const { id } = Route.useParams();
  // suppress unused warning until user context is used in this component
  void useRouteContext({ from: "/_authed" });

  return (
    <main>
      <h1>CV Editor</h1>
      <p>Editing CV: {id}</p>
      <p>CV editor coming soon.</p>
    </main>
  );
}
