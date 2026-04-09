import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPublicCVFn } from "../../src/server/cv-fns.js";
import { CVDocument } from "@hagerf-cv/renderer";
import "@hagerf-cv/renderer/print.css";

export const Route = createFileRoute("/share/$token")({
  loader: async ({ params }) => {
    const data = await getPublicCVFn({ data: { token: params.token } });
    if (!data) throw notFound();
    return data;
  },
  component: SharePage,
  head: () => ({
    meta: [{ title: "CV" }],
  }),
});

function SharePage() {
  const cvData = Route.useLoaderData();

  return (
    <>
      <div className="cv-preview-page">
        <CVDocument data={cvData} />
      </div>

      <style>{`
        body {
          margin: 0;
          background: #e5e5e5;
        }

        .cv-preview-page {
          display: flex;
          justify-content: center;
          padding: 2rem 0 3rem;
        }

        .cv-document {
          box-shadow: 0 2px 16px rgba(0,0,0,.15);
        }

        @media print {
          .cv-preview-page {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            display: block !important;
          }

          body {
            background: transparent !important;
            margin: 0 !important;
          }

          .cv-document {
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </>
  );
}
