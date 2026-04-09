import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCVFn } from "../../src/server/cv-fns.js";
import { CVDocument } from "@hagerf-cv/renderer";
import type { CVEditorData } from "../../src/server/cv.js";
import type { CVDataType } from "@hagerf-cv/renderer";
import "@hagerf-cv/renderer/print.css";

export const Route = createFileRoute("/_authed/cv/$id/preview")({
  loader: ({ params }) => getCVFn({ data: { id: params.id } }),
  component: CvPreview,
  head: () => ({
    meta: [{ title: "CV Preview" }],
  }),
});

function CvPreview() {
  const { id } = Route.useParams();
  const loaderData = Route.useLoaderData() as CVEditorData | null;

  if (!loaderData) {
    throw notFound();
  }

  const { cv, sections_config, profile, work, education, skills, projects } = loaderData;

  const cvData: CVDataType = {
    id: cv.id,
    label: cv.label,
    format: (cv.format === "letter" ? "letter" : "a4") as "a4" | "letter",
    theme: (cv.theme === "compact" ? "compact" : "minimal") as "minimal" | "compact",
    summary_override: cv.summary_override ?? null,
    sections_config,
    profile,
    work,
    education,
    skills,
    projects,
  };

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="cv-preview-toolbar">
        <Link to="/cv/$id" params={{ id }} className="cv-preview-back">
          ← Back to editor
        </Link>
        <button
          type="button"
          className="cv-preview-print-btn"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>

      {/* CV document — the only element that survives @media print */}
      <div className="cv-preview-page">
        <CVDocument data={cvData} />
      </div>

      <style>{`
        /* ── Screen layout ── */
        body {
          margin: 0;
          background: #e5e5e5;
        }

        .cv-preview-toolbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 1.25rem;
          background: #fff;
          border-bottom: 1px solid #ddd;
          box-shadow: 0 1px 4px rgba(0,0,0,.06);
          font-family: system-ui, sans-serif;
          font-size: 0.875rem;
        }

        .cv-preview-back {
          color: #444;
          text-decoration: none;
        }

        .cv-preview-back:hover {
          color: #111;
          text-decoration: underline;
        }

        .cv-preview-print-btn {
          padding: 0.45rem 1rem;
          background: #007bff;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 0.875rem;
          cursor: pointer;
          font-family: system-ui, sans-serif;
        }

        .cv-preview-print-btn:hover {
          background: #0069d9;
        }

        .cv-preview-page {
          padding-top: 52px; /* clear toolbar */
          display: flex;
          justify-content: center;
          padding-bottom: 3rem;
        }

        .cv-document {
          box-shadow: 0 2px 16px rgba(0,0,0,.15);
          margin-top: 2rem;
        }

        /* ── Print overrides ── */
        @media print {
          .cv-preview-toolbar {
            display: none !important;
          }

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
