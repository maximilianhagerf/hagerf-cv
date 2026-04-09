import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  getProfile,
  saveProfile,
  createAvatarUploadUrl,
  updatePhotoUrl,
} from "../../src/server/auth.js";
import type { ProfileLink } from "../../src/server/profile.js";

export const Route = createFileRoute("/_authed/profile")({
  loader: () => getProfile(),
  component: ProfilePage,
});

const LINK_TYPES = [
  { type: "linkedin", label: "LinkedIn" },
  { type: "github", label: "GitHub" },
  { type: "twitter", label: "Twitter / X" },
  { type: "youtube", label: "YouTube" },
] as const;

type PredefinedLinkType = (typeof LINK_TYPES)[number]["type"];

function ProfilePage() {
  const { user } = useRouteContext({ from: "/_authed" });
  const profile = Route.useLoaderData();

  const [name, setName] = useState(profile?.name ?? "");
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [email, setEmail] = useState(profile?.email ?? user.email ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");
  const [links, setLinks] = useState<ProfileLink[]>(profile?.links ?? []);
  const [photoUrl, setPhotoUrl] = useState(profile?.photo_url ?? "");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Profile form submit ---
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    try {
      await saveProfile({
        data: {
          name: name || null,
          headline: headline || null,
          bio: bio || null,
          email: email || null,
          location: location || null,
          links,
        },
      });
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  // --- Photo upload ---
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    try {
      const { signedUrl, publicUrl } = await createAvatarUploadUrl();

      const res = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }

      await updatePhotoUrl({ data: publicUrl });
      setPhotoUrl(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // --- Links helpers ---
  function getLinkUrl(type: PredefinedLinkType): string {
    return links.find((l) => l.type === type)?.url ?? "";
  }

  function setLinkUrl(type: PredefinedLinkType, url: string) {
    setLinks((prev) => {
      const existing = prev.find((l) => l.type === type);
      if (url === "") {
        return prev.filter((l) => l.type !== type);
      }
      if (existing) {
        return prev.map((l) => (l.type === type ? { ...l, url } : l));
      }
      return [...prev, { type, url }];
    });
  }

  function getCustomLinks(): ProfileLink[] {
    return links.filter((l) => l.type === "custom");
  }

  function addCustomLink() {
    setLinks((prev) => [...prev, { type: "custom", url: "", label: "" }]);
  }

  function updateCustomLink(index: number, field: "url" | "label", value: string) {
    let customIndex = 0;
    setLinks((prev) =>
      prev.map((l) => {
        if (l.type !== "custom") return l;
        if (customIndex === index) {
          customIndex++;
          return { ...l, [field]: value };
        }
        customIndex++;
        return l;
      }),
    );
  }

  function removeCustomLink(index: number) {
    let customIndex = 0;
    setLinks((prev) =>
      prev.filter((l) => {
        if (l.type !== "custom") return true;
        const keep = customIndex !== index;
        customIndex++;
        return keep;
      }),
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Profile</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>{user.email ?? user.id}</p>

      {/* Photo upload */}
      <section style={{ marginBottom: "2rem" }}>
        <h2>Photo</h2>
        {photoUrl && (
          <img
            src={photoUrl}
            alt="Profile photo"
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
              marginBottom: "0.75rem",
            }}
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          disabled={uploading}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />
        {uploading && <p>Uploading…</p>}
        {uploadError && <p style={{ color: "red" }}>{uploadError}</p>}
      </section>

      {/* Profile form */}
      <form onSubmit={handleSave}>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend>
            <h2 style={{ margin: "0 0 1rem" }}>Details</h2>
          </legend>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="name" style={{ display: "block", marginBottom: 4 }}>
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="headline" style={{ display: "block", marginBottom: 4 }}>
              Headline
            </label>
            <input
              id="headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="bio" style={{ display: "block", marginBottom: 4 }}>
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: 4 }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="location" style={{ display: "block", marginBottom: 4 }}>
              Location
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </fieldset>

        {/* Social links */}
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend>
            <h2 style={{ margin: "0 0 1rem" }}>Links</h2>
          </legend>

          {LINK_TYPES.map(({ type, label }) => (
            <div key={type} style={{ marginBottom: "1rem" }}>
              <label htmlFor={`link-${type}`} style={{ display: "block", marginBottom: 4 }}>
                {label}
              </label>
              <input
                id={`link-${type}`}
                type="url"
                value={getLinkUrl(type)}
                onChange={(e) => setLinkUrl(type, e.target.value)}
                placeholder={`https://...`}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}

          {/* Custom links */}
          {getCustomLinks().map((link, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                alignItems: "end",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: 4 }}>URL</label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateCustomLink(i, "url", e.target.value)}
                  placeholder="https://..."
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4 }}>Label</label>
                <input
                  type="text"
                  value={link.label ?? ""}
                  onChange={(e) => updateCustomLink(i, "label", e.target.value)}
                  placeholder="My Site"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeCustomLink(i)}
                style={{ marginBottom: 1 }}
              >
                Remove
              </button>
            </div>
          ))}

          <button type="button" onClick={addCustomLink} style={{ marginBottom: "1rem" }}>
            + Add custom link
          </button>
        </fieldset>

        <div style={{ marginTop: "1.5rem" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saveSuccess && (
            <span style={{ marginLeft: "1rem", color: "green" }}>Saved!</span>
          )}
          {saveError && (
            <span style={{ marginLeft: "1rem", color: "red" }}>{saveError}</span>
          )}
        </div>
      </form>
    </main>
  );
}
