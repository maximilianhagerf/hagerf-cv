import React from "react";
import type {
  CVData,
  CVSectionType,
  WorkEntry,
  EducationEntry,
  SkillEntry,
  ProjectEntry,
  ProfileLink,
  SectionConfig,
} from "./schema.js";
import { themes } from "./themes.js";
import type { ThemeClasses, ThemeKey } from "./themes.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

function filterByIds<T extends { id: string }>(
  entries: T[] | undefined,
  included_ids: string[] | undefined,
): T[] {
  if (!entries) return [];
  if (!included_ids) return entries;
  return entries.filter((e) => included_ids.includes(e.id));
}

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  const s = start ?? "";
  const e = end ?? "Present";
  if (!s && !end) return "";
  if (!s) return e;
  return `${s} – ${e}`;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function SummarySection({
  text,
  cls,
}: {
  text: string;
  cls: ThemeClasses;
}) {
  return (
    <section className={cls.section}>
      <h2 className={cls.sectionTitle}>Summary</h2>
      <p className={cls.entryBody}>{text}</p>
    </section>
  );
}

function WorkSection({
  entries,
  cls,
}: {
  entries: WorkEntry[];
  cls: ThemeClasses;
}) {
  if (entries.length === 0) return null;
  return (
    <section className={cls.section}>
      <h2 className={cls.sectionTitle}>Work Experience</h2>
      {entries.map((e) => (
        <div key={e.id} className="cv-entry">
          <div>
            <span className={cls.entryDate}>
              {formatDateRange(e.start_date, e.end_date)}
            </span>
            <span className={cls.entryTitle}>{e.role}</span>
            {" · "}
            <span className={cls.entrySubtitle}>{e.company}</span>
          </div>
          {e.description && (
            <p className={cls.entryBody}>{e.description}</p>
          )}
          {e.bullets && e.bullets.length > 0 && (
            <ul className="cv-entry-bullets">
              {e.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

function EducationSection({
  entries,
  cls,
}: {
  entries: EducationEntry[];
  cls: ThemeClasses;
}) {
  if (entries.length === 0) return null;
  return (
    <section className={cls.section}>
      <h2 className={cls.sectionTitle}>Education</h2>
      {entries.map((e) => (
        <div key={e.id} className="cv-entry">
          <div>
            <span className={cls.entryDate}>
              {formatDateRange(e.start_date, e.end_date)}
            </span>
            <span className={cls.entryTitle}>{e.institution}</span>
          </div>
          {(e.degree ?? e.field_of_study) && (
            <p className={cls.entrySubtitle}>
              {[e.degree, e.field_of_study].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}

function SkillsSection({
  entries,
  cls,
}: {
  entries: SkillEntry[];
  cls: ThemeClasses;
}) {
  if (entries.length === 0) return null;
  return (
    <section className={cls.section}>
      <h2 className={cls.sectionTitle}>Skills</h2>
      {entries.map((e) => (
        <div key={e.id} className={cls.skillCategory}>
          <span className="cv-skill-label">{e.category}: </span>
          <span className={cls.skillItems}>
            {(e.items ?? []).join(", ")}
          </span>
        </div>
      ))}
    </section>
  );
}

function ProjectsSection({
  entries,
  cls,
}: {
  entries: ProjectEntry[];
  cls: ThemeClasses;
}) {
  if (entries.length === 0) return null;
  return (
    <section className={cls.section}>
      <h2 className={cls.sectionTitle}>Projects</h2>
      {entries.map((e) => (
        <div key={e.id} className="cv-entry">
          <span className={cls.entryTitle}>
            {e.url ? (
              <a href={e.url} target="_blank" rel="noopener noreferrer">
                {e.title}
              </a>
            ) : (
              e.title
            )}
          </span>
          {e.description && (
            <p className={cls.entryBody}>{e.description}</p>
          )}
        </div>
      ))}
    </section>
  );
}

function LinksSection({
  links,
  cls,
}: {
  links: ProfileLink[];
  cls: ThemeClasses;
}) {
  if (links.length === 0) return null;
  return (
    <section className={cls.section}>
      <h2 className={cls.sectionTitle}>Links</h2>
      <div className={cls.links}>
        {links.map((l, i) => (
          <span key={i} className={cls.linkItem}>
            <a href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          </span>
        ))}
      </div>
    </section>
  );
}

// ── CVDocument ────────────────────────────────────────────────────────────────

export interface CVDocumentProps {
  data: CVData;
}

export function CVDocument({ data }: CVDocumentProps): React.ReactElement {
  const { format, theme, profile, sections_config } = data;

  const themeKey: ThemeKey = theme in themes ? (theme as ThemeKey) : "minimal";
  const cls = themes[themeKey];

  const formatClass =
    format === "letter" ? "cv-format-letter" : "cv-format-a4";

  // Build an ordered list of visible sections
  const visibleSections: SectionConfig[] = [...sections_config]
    .filter((s) => s.visible);

  const summaryText =
    data.summary_override ?? profile.bio ?? null;

  function renderSection(section: SectionConfig): React.ReactNode {
    const sectionType = section.type as CVSectionType;

    switch (sectionType) {
      case "summary":
        return summaryText ? (
          <SummarySection key="summary" text={summaryText} cls={cls} />
        ) : null;

      case "work": {
        const entries = filterByIds(data.work, section.included_ids);
        return (
          <WorkSection key="work" entries={entries} cls={cls} />
        );
      }

      case "education": {
        const entries = filterByIds(data.education, section.included_ids);
        return (
          <EducationSection
            key="education"
            entries={entries}
            cls={cls}
          />
        );
      }

      case "skills": {
        const entries = filterByIds(data.skills, section.included_ids);
        return <SkillsSection key="skills" entries={entries} cls={cls} />;
      }

      case "projects": {
        const entries = filterByIds(data.projects, section.included_ids);
        return (
          <ProjectsSection key="projects" entries={entries} cls={cls} />
        );
      }

      case "links": {
        const links = profile.links ?? [];
        return <LinksSection key="links" links={links} cls={cls} />;
      }

      default:
        return null;
    }
  }

  if (themeKey === "compact") {
    const sidebarSections: CVSectionType[] = ["summary", "skills", "links"];
    const mainSections: CVSectionType[] = ["work", "education", "projects"];

    const sidebar = visibleSections.filter((s) =>
      sidebarSections.includes(s.type as CVSectionType)
    );
    const main = visibleSections.filter((s) =>
      mainSections.includes(s.type as CVSectionType)
    );

    return (
      <div className={`${cls.document} ${formatClass}`} data-format={format} data-theme={theme}>
        <aside className="cv-sidebar">
          <header className={cls.header}>
            <h1 className={cls.name}>{profile.name ?? ""}</h1>
            {profile.headline && (
              <p className={cls.headline}>{profile.headline}</p>
            )}
            {(profile.email ?? profile.location) && (
              <div className={cls.meta}>
                {profile.email && <span>{profile.email}</span>}
                {profile.location && <span>{profile.location}</span>}
              </div>
            )}
          </header>
          {sidebar.map((s) => renderSection(s))}
        </aside>
        <main className="cv-main">
          {main.map((s) => renderSection(s))}
        </main>
      </div>
    );
  }

  return (
    <div className={`${cls.document} ${formatClass}`} data-format={format} data-theme={theme}>
      {/* Header */}
      <header className={cls.header}>
        <h1 className={cls.name}>{profile.name ?? ""}</h1>
        {profile.headline && (
          <p className={cls.headline}>{profile.headline}</p>
        )}
        {(profile.email ?? profile.location) && (
          <div className={cls.meta}>
            {profile.email && <span>{profile.email}</span>}
            {profile.location && <span>{profile.location}</span>}
          </div>
        )}
      </header>

      {/* Ordered visible sections */}
      {visibleSections.map((s) => renderSection(s))}
    </div>
  );
}
