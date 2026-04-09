export const themes = {
  minimal: {
    document: "cv-document cv-theme-minimal",
    header: "cv-header",
    name: "cv-name",
    headline: "cv-headline",
    meta: "cv-meta",
    section: "cv-section",
    sectionTitle: "cv-section-title",
    entryTitle: "cv-entry-title",
    entrySubtitle: "cv-entry-subtitle",
    entryDate: "cv-entry-date",
    entryBody: "cv-entry-body",
    skillCategory: "cv-skill-category",
    skillItems: "cv-skill-items",
    links: "cv-links",
    linkItem: "cv-link-item",
  },
} as const;

export type ThemeKey = keyof typeof themes;
export type ThemeClasses = (typeof themes)[ThemeKey];
