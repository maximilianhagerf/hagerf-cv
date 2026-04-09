import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/cv/$id/preview")({
  component: CvPreview,
});

function CvPreview() {
  const { id } = Route.useParams();

  return (
    <main>
      <h1>CV Preview</h1>
      <p>Preview for CV: {id}</p>
      <p>Coming soon.</p>
    </main>
  );
}
