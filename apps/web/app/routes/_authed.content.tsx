import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import {
  getWorkExperiences,
  addWorkExperience,
  editWorkExperience,
  removeWorkExperience,
  reorderWorkExperiencesFn,
  getEducation,
  addEducation,
  editEducation,
  removeEducation,
  reorderEducationFn,
  getSkills,
  addSkill,
  editSkill,
  removeSkill,
  reorderSkillsFn,
  getProjects,
  addProject,
  editProject,
  removeProject,
  reorderProjectsFn,
} from "../../src/server/content-fns.js";
import type {
  WorkExperienceInput,
  EducationInput,
  SkillInput,
  ProjectInput,
} from "../../src/server/content.js";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authed/content")({
  loader: async () => {
    const [workExperiences, education, skillsList, projectsList] =
      await Promise.all([
        getWorkExperiences(),
        getEducation(),
        getSkills(),
        getProjects(),
      ]);
    return { workExperiences, education, skillsList, projectsList };
  },
  component: ContentPage,
});

// ---------------------------------------------------------------------------
// Types (local row shapes returned from server)
// ---------------------------------------------------------------------------

type WorkRow = {
  id: string;
  company: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
  bullets: unknown;
  sort_order: number;
};

type EduRow = {
  id: string;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
};

type SkillRow = {
  id: string;
  category: string;
  items: unknown;
  sort_order: number;
};

type ProjectRow = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  sort_order: number;
};

// ---------------------------------------------------------------------------
// Drag-and-drop hook
// ---------------------------------------------------------------------------

function useDragReorder<T extends { id: string }>(
  items: T[],
  setItems: React.Dispatch<React.SetStateAction<T[]>>,
  onReorder: (orderedIds: string[]) => Promise<void>,
) {
  const dragIndex = useRef<number | null>(null);

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;

    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(index, 0, moved!);
      dragIndex.current = index;
      return next;
    });
  }

  async function handleDrop() {
    dragIndex.current = null;
    await onReorder(items.map((i) => i.id));
  }

  return { handleDragStart, handleDragOver, handleDrop };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function ContentPage() {
  const loaderData = Route.useLoaderData();

  const [workItems, setWorkItems] = useState<WorkRow[]>(loaderData.workExperiences as WorkRow[]);
  const [eduItems, setEduItems] = useState<EduRow[]>(loaderData.education as EduRow[]);
  const [skillItems, setSkillItems] = useState<SkillRow[]>(loaderData.skillsList as SkillRow[]);
  const [projectItems, setProjectItems] = useState<ProjectRow[]>(loaderData.projectsList as ProjectRow[]);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Content</h1>
      <WorkSection items={workItems} setItems={setWorkItems} />
      <EducationSection items={eduItems} setItems={setEduItems} />
      <SkillsSection items={skillItems} setItems={setSkillItems} />
      <ProjectsSection items={projectItems} setItems={setProjectItems} />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem",
  border: "1px solid #ddd",
  borderRadius: 4,
  marginBottom: "0.5rem",
  background: "#fff",
  cursor: "grab",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  marginBottom: "0.5rem",
};

function SectionHeader({ title }: { title: string }) {
  return <h2 style={{ marginTop: "2rem" }}>{title}</h2>;
}

// ---------------------------------------------------------------------------
// Work Experience Section
// ---------------------------------------------------------------------------

const emptyWork: WorkExperienceInput = {
  company: "",
  role: "",
  start_date: "",
  end_date: "",
  description: "",
  bullets: [],
};

function WorkSection({
  items,
  setItems,
}: {
  items: WorkRow[];
  setItems: React.Dispatch<React.SetStateAction<WorkRow[]>>;
}) {
  const [form, setForm] = useState<WorkExperienceInput>(emptyWork);
  const [editId, setEditId] = useState<string | null>(null);
  const [bulletsText, setBulletsText] = useState(""); // newline-separated
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doReorder = useCallback(
    async (orderedIds: string[]) => {
      await reorderWorkExperiencesFn({ data: { orderedIds } });
    },
    [],
  );

  // Update items order via drag; we need the latest items snapshot for the callback
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    items,
    setItems,
    doReorder,
  );

  function startEdit(row: WorkRow) {
    setEditId(row.id);
    setForm({
      company: row.company,
      role: row.role,
      start_date: row.start_date ?? "",
      end_date: row.end_date ?? "",
      description: row.description ?? "",
      bullets: (row.bullets as string[]) ?? [],
    });
    setBulletsText(((row.bullets as string[]) ?? []).join("\n"));
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyWork);
    setBulletsText("");
    setError("");
  }

  function parseBullets(text: string): string[] {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input = { ...form, bullets: parseBullets(bulletsText) };
      if (editId) {
        const updated = await editWorkExperience({ data: { id: editId, ...input } });
        if (updated) {
          setItems((prev) => prev.map((r) => (r.id === editId ? (updated as WorkRow) : r)));
        }
        setEditId(null);
      } else {
        const created = await addWorkExperience({ data: input });
        setItems((prev) => [...prev, created as WorkRow]);
      }
      setForm(emptyWork);
      setBulletsText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await removeWorkExperience({ data: { id } });
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section>
      <SectionHeader title="Work Experience" />

      {items.map((row, index) => (
        <div
          key={row.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          style={rowStyle}
        >
          <span style={{ flex: 1 }}>
            <strong>{row.role}</strong> @ {row.company} —{" "}
            {row.start_date ?? ""}
            {" – "}
            {row.end_date ? row.end_date : "Present"}
          </span>
          <button type="button" onClick={() => startEdit(row)}>Edit</button>
          <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
        </div>
      ))}

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>{editId ? "Edit Entry" : "Add Work Experience"}</h3>
        <label style={{ display: "block", marginBottom: 2 }}>Company *</label>
        <input required style={inputStyle} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
        <label style={{ display: "block", marginBottom: 2 }}>Role *</label>
        <input required style={inputStyle} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
        <label style={{ display: "block", marginBottom: 2 }}>Start Date</label>
        <input style={inputStyle} value={form.start_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value || null }))} placeholder="e.g. 2020-01" />
        <label style={{ display: "block", marginBottom: 2 }}>End Date (leave blank for Present)</label>
        <input style={inputStyle} value={form.end_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))} placeholder="e.g. 2023-06 or blank = Present" />
        <label style={{ display: "block", marginBottom: 2 }}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} />
        <label style={{ display: "block", marginBottom: 2 }}>Bullet Points (one per line)</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={4} value={bulletsText} onChange={(e) => setBulletsText(e.target.value)} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : editId ? "Update" : "Add"}</button>
          {editId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Education Section
// ---------------------------------------------------------------------------

const emptyEdu: EducationInput = {
  institution: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
};

function EducationSection({
  items,
  setItems,
}: {
  items: EduRow[];
  setItems: React.Dispatch<React.SetStateAction<EduRow[]>>;
}) {
  const [form, setForm] = useState<EducationInput>(emptyEdu);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doReorder = useCallback(
    async (orderedIds: string[]) => {
      await reorderEducationFn({ data: { orderedIds } });
    },
    [],
  );

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    items,
    setItems,
    doReorder,
  );

  function startEdit(row: EduRow) {
    setEditId(row.id);
    setForm({
      institution: row.institution,
      degree: row.degree ?? "",
      field_of_study: row.field_of_study ?? "",
      start_date: row.start_date ?? "",
      end_date: row.end_date ?? "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyEdu);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input: EducationInput = {
        institution: form.institution,
        degree: form.degree || null,
        field_of_study: form.field_of_study || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      if (editId) {
        const updated = await editEducation({ data: { id: editId, ...input } });
        if (updated) {
          setItems((prev) => prev.map((r) => (r.id === editId ? (updated as EduRow) : r)));
        }
        setEditId(null);
      } else {
        const created = await addEducation({ data: input });
        setItems((prev) => [...prev, created as EduRow]);
      }
      setForm(emptyEdu);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await removeEducation({ data: { id } });
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section>
      <SectionHeader title="Education" />

      {items.map((row, index) => (
        <div
          key={row.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          style={rowStyle}
        >
          <span style={{ flex: 1 }}>
            <strong>{row.degree ?? "Degree"}</strong>
            {row.field_of_study ? ` in ${row.field_of_study}` : ""} — {row.institution}
          </span>
          <button type="button" onClick={() => startEdit(row)}>Edit</button>
          <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
        </div>
      ))}

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>{editId ? "Edit Entry" : "Add Education"}</h3>
        <label style={{ display: "block", marginBottom: 2 }}>Institution *</label>
        <input required style={inputStyle} value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
        <label style={{ display: "block", marginBottom: 2 }}>Degree</label>
        <input style={inputStyle} value={form.degree ?? ""} onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value || null }))} placeholder="e.g. B.Sc." />
        <label style={{ display: "block", marginBottom: 2 }}>Field of Study</label>
        <input style={inputStyle} value={form.field_of_study ?? ""} onChange={(e) => setForm((f) => ({ ...f, field_of_study: e.target.value || null }))} placeholder="e.g. Computer Science" />
        <label style={{ display: "block", marginBottom: 2 }}>Start Date</label>
        <input style={inputStyle} value={form.start_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value || null }))} placeholder="e.g. 2016-09" />
        <label style={{ display: "block", marginBottom: 2 }}>End Date</label>
        <input style={inputStyle} value={form.end_date ?? ""} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value || null }))} placeholder="e.g. 2020-06" />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : editId ? "Update" : "Add"}</button>
          {editId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Skills Section
// ---------------------------------------------------------------------------

const emptySkill: SkillInput = { category: "", items: [] };

function SkillsSection({
  items,
  setItems,
}: {
  items: SkillRow[];
  setItems: React.Dispatch<React.SetStateAction<SkillRow[]>>;
}) {
  const [form, setForm] = useState<SkillInput>(emptySkill);
  const [itemsText, setItemsText] = useState(""); // comma-separated
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doReorder = useCallback(
    async (orderedIds: string[]) => {
      await reorderSkillsFn({ data: { orderedIds } });
    },
    [],
  );

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    items,
    setItems,
    doReorder,
  );

  function startEdit(row: SkillRow) {
    setEditId(row.id);
    const rowItems = (row.items as string[]) ?? [];
    setForm({ category: row.category, items: rowItems });
    setItemsText(rowItems.join(", "));
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptySkill);
    setItemsText("");
    setError("");
  }

  function parseItems(text: string): string[] {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input: SkillInput = { category: form.category, items: parseItems(itemsText) };
      if (editId) {
        const updated = await editSkill({ data: { id: editId, ...input } });
        if (updated) {
          setItems((prev) => prev.map((r) => (r.id === editId ? (updated as SkillRow) : r)));
        }
        setEditId(null);
      } else {
        const created = await addSkill({ data: input });
        setItems((prev) => [...prev, created as SkillRow]);
      }
      setForm(emptySkill);
      setItemsText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await removeSkill({ data: { id } });
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section>
      <SectionHeader title="Skills" />

      {items.map((row, index) => (
        <div
          key={row.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          style={rowStyle}
        >
          <span style={{ flex: 1 }}>
            <strong>{row.category}</strong>:{" "}
            {((row.items as string[]) ?? []).join(", ")}
          </span>
          <button type="button" onClick={() => startEdit(row)}>Edit</button>
          <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
        </div>
      ))}

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>{editId ? "Edit Category" : "Add Skill Category"}</h3>
        <label style={{ display: "block", marginBottom: 2 }}>Category Name *</label>
        <input required style={inputStyle} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Languages" />
        <label style={{ display: "block", marginBottom: 2 }}>Skills (comma-separated)</label>
        <input style={inputStyle} value={itemsText} onChange={(e) => setItemsText(e.target.value)} placeholder="e.g. TypeScript, Go, Rust" />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : editId ? "Update" : "Add"}</button>
          {editId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Projects Section
// ---------------------------------------------------------------------------

const emptyProject: ProjectInput = { title: "", url: "", description: "" };

function ProjectsSection({
  items,
  setItems,
}: {
  items: ProjectRow[];
  setItems: React.Dispatch<React.SetStateAction<ProjectRow[]>>;
}) {
  const [form, setForm] = useState<ProjectInput>(emptyProject);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const doReorder = useCallback(
    async (orderedIds: string[]) => {
      await reorderProjectsFn({ data: { orderedIds } });
    },
    [],
  );

  const { handleDragStart, handleDragOver, handleDrop } = useDragReorder(
    items,
    setItems,
    doReorder,
  );

  function startEdit(row: ProjectRow) {
    setEditId(row.id);
    setForm({
      title: row.title,
      url: row.url ?? "",
      description: row.description ?? "",
    });
  }

  function cancelEdit() {
    setEditId(null);
    setForm(emptyProject);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const input: ProjectInput = {
        title: form.title,
        url: form.url || null,
        description: form.description || null,
      };
      if (editId) {
        const updated = await editProject({ data: { id: editId, ...input } });
        if (updated) {
          setItems((prev) => prev.map((r) => (r.id === editId ? (updated as ProjectRow) : r)));
        }
        setEditId(null);
      } else {
        const created = await addProject({ data: input });
        setItems((prev) => [...prev, created as ProjectRow]);
      }
      setForm(emptyProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await removeProject({ data: { id } });
    setItems((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section>
      <SectionHeader title="Projects" />

      {items.map((row, index) => (
        <div
          key={row.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          style={rowStyle}
        >
          <span style={{ flex: 1 }}>
            <strong>{row.title}</strong>
            {row.url ? (
              <>
                {" — "}
                <a href={row.url} target="_blank" rel="noopener noreferrer">
                  {row.url}
                </a>
              </>
            ) : null}
          </span>
          <button type="button" onClick={() => startEdit(row)}>Edit</button>
          <button type="button" onClick={() => handleDelete(row.id)}>Delete</button>
        </div>
      ))}

      <form onSubmit={handleSubmit} style={{ marginTop: "1rem", border: "1px solid #eee", padding: "1rem", borderRadius: 4 }}>
        <h3 style={{ margin: "0 0 0.75rem" }}>{editId ? "Edit Project" : "Add Project"}</h3>
        <label style={{ display: "block", marginBottom: 2 }}>Title *</label>
        <input required style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <label style={{ display: "block", marginBottom: 2 }}>URL</label>
        <input style={inputStyle} type="url" value={form.url ?? ""} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value || null }))} placeholder="https://..." />
        <label style={{ display: "block", marginBottom: 2 }}>Description</label>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={3} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : editId ? "Update" : "Add"}</button>
          {editId && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}
