import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getCVs,
  createCVFn,
  renameCVFn,
  deleteCVFn,
  duplicateCVFn,
} from "../../src/server/cv-fns.js";
import { signOut } from "../../src/server/auth.js";
import { isCreateCVError } from "../../src/server/cv.js";

export const Route = createFileRoute("/_authed/dashboard")({
  loader: () => getCVs(),
  component: Dashboard,
});

type CVRow = {
  id: string;
  label: string;
  updated_at: Date | string;
  view_count: number;
};

function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Dashboard() {
  const cvs = Route.useLoaderData() as CVRow[];
  const router = useRouter();

  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSignOut(e: React.FormEvent) {
    e.preventDefault();
    await signOut();
  }

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const result = await createCVFn({ data: {} });
      if (isCreateCVError(result)) {
        setError(result.error);
        return;
      }
      await router.navigate({ to: "/cv/$id", params: { id: result.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create CV");
    } finally {
      setCreating(false);
    }
  }

  function startRename(cv: CVRow) {
    setRenamingId(cv.id);
    setRenameValue(cv.label);
  }

  async function commitRename(id: string) {
    const label = renameValue.trim();
    if (!label) {
      setRenamingId(null);
      return;
    }
    setBusyId(id);
    setError("");
    try {
      await renameCVFn({ data: { id, label } });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename CV");
    } finally {
      setRenamingId(null);
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError("");
    try {
      await deleteCVFn({ data: { id } });
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete CV");
    } finally {
      setPendingDeleteId(null);
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    setError("");
    try {
      const result = await duplicateCVFn({ data: { id } });
      if (isCreateCVError(result)) {
        setError(result.error);
        return;
      }
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate CV");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>My CVs</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link to="/profile">Profile</Link>
          <form onSubmit={handleSignOut} style={{ display: "inline" }}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </div>

      {error && (
        <p role="alert" style={{ color: "red", marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      <button onClick={handleCreate} disabled={creating} style={{ marginBottom: "2rem" }}>
        {creating ? "Creating…" : "+ New CV"}
      </button>

      {cvs.length === 0 ? (
        <p style={{ color: "#666" }}>No CVs yet. Create your first one above.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {cvs.map((cv) => (
            <li
              key={cv.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {renamingId === cv.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void commitRename(cv.id);
                    }}
                    style={{ display: "flex", gap: "0.5rem" }}
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="submit" disabled={busyId === cv.id}>
                      Save
                    </button>
                    <button type="button" onClick={() => setRenamingId(null)}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <strong>{cv.label}</strong>
                    <span style={{ marginLeft: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                      Updated {formatDate(cv.updated_at)}
                    </span>
                    <span style={{ marginLeft: "0.75rem", color: "#888", fontSize: "0.875rem" }}>
                      {cv.view_count} {cv.view_count === 1 ? "view" : "views"}
                    </span>
                  </>
                )}
              </div>

              {renamingId !== cv.id && (
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <Link to="/cv/$id" params={{ id: cv.id }}>
                    Edit
                  </Link>
                  <Link to="/cv/$id/preview" params={{ id: cv.id }}>
                    Preview
                  </Link>
                  <button
                    type="button"
                    onClick={() => startRename(cv)}
                    disabled={busyId === cv.id}
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDuplicate(cv.id)}
                    disabled={busyId === cv.id}
                  >
                    Duplicate
                  </button>
                  {pendingDeleteId === cv.id ? (
                    <>
                      <span style={{ color: "red", fontSize: "0.875rem" }}>Delete?</span>
                      <button
                        type="button"
                        onClick={() => void handleDelete(cv.id)}
                        disabled={busyId === cv.id}
                        style={{ color: "red" }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(cv.id)}
                      disabled={busyId === cv.id}
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
