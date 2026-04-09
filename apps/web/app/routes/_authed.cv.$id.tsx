import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { getCVFn, updateCVConfigFn, toggleCVPublicFn, regenerateShareTokenFn } from "../../src/server/cv-fns.js";
import type { SectionConfigType } from "@hagerf-cv/renderer";
import type { CVEditorData, CVDocumentRow } from "../../src/server/cv.js";

export const Route = createFileRoute("/_authed/cv/$id")({
  loader: ({ params }) => getCVFn({ data: { id: params.id } }),
  component: CvEditor,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SECTION_LABELS: Record<string, string> = {
  summary: "Summary",
  work: "Work Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  links: "Links",
};

function hasEntries(type: string): type is "work" | "education" | "projects" {
  return type === "work" || type === "education" || type === "projects";
}

// ---------------------------------------------------------------------------
// Entry selection panel for a section
// ---------------------------------------------------------------------------

function EntrySelection({
  sectionType,
  data,
  includedIds,
  onChange,
}: {
  sectionType: "work" | "education" | "projects";
  data: CVEditorData;
  includedIds: string[] | undefined;
  onChange: (ids: string[] | undefined) => void;
}) {
  type Entry = { id: string; label: string };
  let entries: Entry[] = [];

  if (sectionType === "work") {
    entries = data.work.map((e) => ({
      id: e.id,
      label: `${e.role} at ${e.company}`,
    }));
  } else if (sectionType === "education") {
    entries = data.education.map((e) => ({
      id: e.id,
      label: e.institution + (e.degree ? ` — ${e.degree}` : ""),
    }));
  } else if (sectionType === "projects") {
    entries = data.projects.map((e) => ({ id: e.id, label: e.title }));
  }

  if (entries.length === 0) return null;

  // undefined = all included
  const allChecked = includedIds === undefined;

  function toggle(id: string) {
    const current = includedIds ?? entries.map((e) => e.id);
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    // If all are selected, normalise to undefined (all)
    onChange(next.length === entries.length ? undefined : next);
  }

  function toggleAll() {
    onChange(allChecked ? [] : undefined);
  }

  return (
    <div style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.25rem",
          fontSize: "0.8rem",
          color: "#555",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={allChecked}
          onChange={toggleAll}
        />
        All entries
      </label>
      {entries.map((e) => {
        const checked = allChecked || (includedIds?.includes(e.id) ?? false);
        return (
          <label
            key={e.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.2rem",
              fontSize: "0.8rem",
              color: "#333",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(e.id)}
            />
            {e.label}
          </label>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable section row
// ---------------------------------------------------------------------------

function SectionRow({
  section,
  data,
  onToggleVisible,
  onIncludedIdsChange,
  onDragStart,
  onDragOver,
  onDrop,
  dragOverIndex,
  index,
}: {
  section: SectionConfigType;
  data: CVEditorData;
  onToggleVisible: () => void;
  onIncludedIdsChange: (ids: string[] | undefined) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  dragOverIndex: number | null;
  index: number;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={onDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "0.5rem 0.75rem",
        border: "1px solid",
        borderColor: dragOverIndex === index ? "#007bff" : "#ddd",
        borderRadius: 6,
        marginBottom: "0.5rem",
        background: dragOverIndex === index ? "#f0f7ff" : "#fff",
        cursor: "grab",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span style={{ color: "#aaa", fontSize: "1rem" }}>⠿</span>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flex: 1,
            cursor: "pointer",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={section.visible}
            onChange={onToggleVisible}
          />
          <span style={{ fontWeight: 500 }}>
            {SECTION_LABELS[section.type] ?? section.type}
          </span>
        </label>
      </div>

      {section.visible && hasEntries(section.type) && (
        <EntrySelection
          sectionType={section.type}
          data={data}
          includedIds={section.included_ids}
          onChange={onIncludedIdsChange}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Share panel
// ---------------------------------------------------------------------------

function SharePanel({ cv, onCVUpdate }: { cv: CVDocumentRow; onCVUpdate: (updated: CVDocumentRow) => void }) {
  const [toggling, setToggling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${cv.share_token}`;

  async function handleTogglePublic() {
    setToggling(true);
    try {
      const updated = await toggleCVPublicFn({ data: { id: cv.id, is_public: !cv.is_public } });
      if (updated) onCVUpdate(updated);
    } finally {
      setToggling(false);
    }
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const updated = await regenerateShareTokenFn({ data: { id: cv.id } });
      if (updated) onCVUpdate(updated);
    } finally {
      setRegenerating(false);
    }
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(null), 2000);
    });
  }

  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Sharing</h2>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          cursor: toggling ? "wait" : "pointer",
          fontSize: "0.875rem",
        }}
      >
        <input
          type="checkbox"
          checked={cv.is_public}
          onChange={() => { void handleTogglePublic(); }}
          disabled={toggling}
        />
        {cv.is_public ? "Public" : "Private"}
      </label>

      {cv.is_public && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#555",
              wordBreak: "break-all",
              background: "#f5f5f5",
              padding: "0.4rem 0.6rem",
              borderRadius: 4,
              border: "1px solid #ddd",
            }}
          >
            {shareUrl}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                cursor: "pointer",
              }}
            >
              {copyMsg ?? "Copy link"}
            </button>
            <button
              type="button"
              onClick={() => { void handleRegenerate(); }}
              disabled={regenerating}
              style={{
                padding: "0.35rem 0.75rem",
                fontSize: "0.8rem",
                border: "1px solid #ccc",
                borderRadius: 4,
                background: "#fff",
                cursor: regenerating ? "wait" : "pointer",
                color: "#c00",
              }}
            >
              {regenerating ? "Regenerating…" : "Regenerate link"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main editor component
// ---------------------------------------------------------------------------

function CvEditor() {
  const { id } = Route.useParams();
  const loaderData = Route.useLoaderData() as CVEditorData | null;

  if (!loaderData) {
    throw notFound();
  }

  const { cv: initialCv, sections_config: initialSections, profile } = loaderData;

  const [cv, setCv] = useState<CVDocumentRow>(initialCv);
  const [theme, setTheme] = useState(initialCv.theme);
  const [format, setFormat] = useState(initialCv.format);
  const [summaryOverride, setSummaryOverride] = useState(initialCv.summary_override ?? "");
  const [sections, setSections] = useState<SectionConfigType[]>(initialSections);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  const save = useCallback(
    async (overrides?: {
      theme?: string;
      format?: string;
      summaryOverride?: string;
      sections?: SectionConfigType[];
    }) => {
      setSaving(true);
      setSaveMsg(null);
      const currentTheme = overrides?.theme ?? theme;
      const currentFormat = overrides?.format ?? format;
      const currentSummaryOverride = overrides?.summaryOverride ?? summaryOverride;
      const currentSections = overrides?.sections ?? sections;
      try {
        await updateCVConfigFn({
          data: {
            id,
            theme: currentTheme,
            format: currentFormat,
            summary_override: currentSummaryOverride || null,
            sections_config: currentSections,
          },
        });
        setSaveMsg({ type: "success", text: "Saved" });
        setTimeout(() => setSaveMsg(null), 2000);
      } catch (err) {
        setSaveMsg({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to save",
        });
      } finally {
        setSaving(false);
      }
    },
    [id, theme, format, summaryOverride, sections],
  );

  // ---------------------------------------------------------------------------
  // Field change handlers (auto-save)
  // ---------------------------------------------------------------------------

  function handleThemeChange(newTheme: string) {
    setTheme(newTheme);
    void save({ theme: newTheme });
  }

  function handleFormatChange(newFormat: string) {
    setFormat(newFormat);
    void save({ format: newFormat });
  }

  function handleSectionToggle(index: number) {
    const next = sections.map((s, i) =>
      i === index ? { ...s, visible: !s.visible } : s,
    );
    setSections(next);
    void save({ sections: next });
  }

  function handleIncludedIdsChange(index: number, ids: string[] | undefined) {
    const next = sections.map((s, i) => {
      if (i !== index) return s;
      const updated = { ...s };
      if (ids === undefined) {
        delete (updated as { included_ids?: string[] }).included_ids;
      } else {
        (updated as { included_ids?: string[] }).included_ids = ids;
      }
      return updated;
    });
    setSections(next);
    void save({ sections: next });
  }

  // ---------------------------------------------------------------------------
  // Drag-and-drop
  // ---------------------------------------------------------------------------

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(index: number) {
    setDragOverIndex(index);
  }

  function handleDrop() {
    const from = dragIndexRef.current;
    const to = dragOverIndex;
    dragIndexRef.current = null;
    setDragOverIndex(null);
    if (from === null || to === null || from === to) return;

    const next = [...sections];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    setSections(next);
    void save({ sections: next });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const summaryFallback = profile.bio ?? "";

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <Link to="/dashboard" style={{ color: "#555", fontSize: "0.875rem" }}>
            ← Dashboard
          </Link>
          <h1 style={{ margin: "0.25rem 0 0" }}>{cv.label}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {saveMsg && (
            <span
              style={{
                fontSize: "0.875rem",
                color: saveMsg.type === "success" ? "green" : "red",
              }}
            >
              {saveMsg.text}
            </span>
          )}
          {saving && (
            <span style={{ fontSize: "0.875rem", color: "#888" }}>Saving…</span>
          )}
          <Link to="/cv/$id/preview" params={{ id }}>
            Preview
          </Link>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px 1fr",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* Left panel: config */}
        <div>
          {/* Theme picker */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Theme</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["minimal", "compact"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleThemeChange(t)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    border: "1px solid",
                    borderColor: theme === t ? "#007bff" : "#ccc",
                    borderRadius: 4,
                    background: theme === t ? "#007bff" : "#fff",
                    color: theme === t ? "#fff" : "#333",
                    cursor: "pointer",
                    fontWeight: theme === t ? 600 : 400,
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          {/* Format picker */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Format</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {(["a4", "letter"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFormatChange(f)}
                  style={{
                    padding: "0.4rem 0.9rem",
                    border: "1px solid",
                    borderColor: format === f ? "#007bff" : "#ccc",
                    borderRadius: 4,
                    background: format === f ? "#007bff" : "#fff",
                    color: format === f ? "#fff" : "#333",
                    cursor: "pointer",
                    fontWeight: format === f ? 600 : 400,
                    textTransform: "uppercase",
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </section>

          {/* Summary override */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Summary override</h2>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#666" }}>
              Leave blank to use your profile bio.
            </p>
            <textarea
              value={summaryOverride}
              onChange={(e) => setSummaryOverride(e.target.value)}
              onBlur={() => void save()}
              rows={4}
              placeholder={summaryFallback || "No bio set on profile"}
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "vertical",
                fontSize: "0.875rem",
              }}
            />
          </section>

          {/* Sharing */}
          <SharePanel cv={cv} onCVUpdate={setCv} />

          {/* Sections */}
          <section>
            <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Sections</h2>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.8rem", color: "#666" }}>
              Drag to reorder · toggle to show/hide
            </p>
            <div
              onDragLeave={() => setDragOverIndex(null)}
            >
              {sections.map((section, index) => (
                <SectionRow
                  key={section.type}
                  section={section}
                  data={loaderData}
                  index={index}
                  dragOverIndex={dragOverIndex}
                  onToggleVisible={() => handleSectionToggle(index)}
                  onIncludedIdsChange={(ids) => handleIncludedIdsChange(index, ids)}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Right panel: preview info */}
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "1.5rem",
            background: "#fafafa",
          }}
        >
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem" }}>CV summary</h2>

          <dl style={{ margin: 0, lineHeight: 1.8 }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <dt style={{ color: "#666", minWidth: 80, fontSize: "0.875rem" }}>Theme:</dt>
              <dd style={{ margin: 0, fontSize: "0.875rem", textTransform: "capitalize" }}>{theme}</dd>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <dt style={{ color: "#666", minWidth: 80, fontSize: "0.875rem" }}>Format:</dt>
              <dd style={{ margin: 0, fontSize: "0.875rem", textTransform: "uppercase" }}>{format}</dd>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <dt style={{ color: "#666", minWidth: 80, fontSize: "0.875rem" }}>Summary:</dt>
              <dd
                style={{
                  margin: 0,
                  fontSize: "0.875rem",
                  color: summaryOverride ? "#333" : "#999",
                  fontStyle: summaryOverride ? "normal" : "italic",
                }}
              >
                {summaryOverride
                  ? summaryOverride.slice(0, 80) + (summaryOverride.length > 80 ? "…" : "")
                  : summaryFallback
                    ? "Profile bio (fallback)"
                    : "None"}
              </dd>
            </div>
          </dl>

          <hr style={{ margin: "1rem 0", borderColor: "#ddd" }} />

          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "#555" }}>
            Visible sections
          </h3>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.875rem" }}>
            {sections
              .filter((s) => s.visible)
              .map((s) => (
                <li key={s.type}>{SECTION_LABELS[s.type] ?? s.type}</li>
              ))}
          </ol>
          {sections.filter((s) => s.visible).length === 0 && (
            <p style={{ color: "#999", fontSize: "0.875rem" }}>No visible sections</p>
          )}

          <div style={{ marginTop: "1.5rem" }}>
            <Link
              to="/cv/$id/preview"
              params={{ id }}
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                background: "#007bff",
                color: "#fff",
                borderRadius: 4,
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Open preview →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
