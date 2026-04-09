import { scope } from "arktype";

const cvScope = scope({
  CVFormat: "'a4' | 'letter'",
  CVTheme: "'minimal' | 'compact'",
  CVSectionType:
    "'summary' | 'work' | 'education' | 'skills' | 'projects' | 'links'",

  SectionConfig: {
    type: "CVSectionType",
    visible: "boolean",
    "included_ids?": "string[]",
  },

  ProfileLink: {
    label: "string",
    url: "string",
  },

  WorkEntry: {
    id: "string",
    company: "string",
    role: "string",
    "start_date?": "string | null",
    "end_date?": "string | null",
    "description?": "string | null",
    "bullets?": "string[]",
    sort_order: "number",
  },

  EducationEntry: {
    id: "string",
    institution: "string",
    "degree?": "string | null",
    "field_of_study?": "string | null",
    "start_date?": "string | null",
    "end_date?": "string | null",
    sort_order: "number",
  },

  SkillEntry: {
    id: "string",
    category: "string",
    "items?": "string[]",
    sort_order: "number",
  },

  ProjectEntry: {
    id: "string",
    title: "string",
    "url?": "string | null",
    "description?": "string | null",
    sort_order: "number",
  },

  CVProfile: {
    "name?": "string | null",
    "headline?": "string | null",
    "bio?": "string | null",
    "email?": "string | null",
    "location?": "string | null",
    "photo_url?": "string | null",
    "links?": "ProfileLink[]",
  },

  CVData: {
    id: "string",
    label: "string",
    format: "CVFormat",
    theme: "CVTheme",
    "summary_override?": "string | null",
    sections_config: "SectionConfig[]",
    profile: "CVProfile",
    "work?": "WorkEntry[]",
    "education?": "EducationEntry[]",
    "skills?": "SkillEntry[]",
    "projects?": "ProjectEntry[]",
  },
}).export();

export const CVFormat = cvScope.CVFormat;
export type CVFormat = typeof CVFormat.infer;

export const CVTheme = cvScope.CVTheme;
export type CVTheme = typeof CVTheme.infer;

export const CVSectionType = cvScope.CVSectionType;
export type CVSectionType = typeof CVSectionType.infer;

export const SectionConfig = cvScope.SectionConfig;
export type SectionConfig = typeof SectionConfig.infer;

export const ProfileLink = cvScope.ProfileLink;
export type ProfileLink = typeof ProfileLink.infer;

export const WorkEntry = cvScope.WorkEntry;
export type WorkEntry = typeof WorkEntry.infer;

export const EducationEntry = cvScope.EducationEntry;
export type EducationEntry = typeof EducationEntry.infer;

export const SkillEntry = cvScope.SkillEntry;
export type SkillEntry = typeof SkillEntry.infer;

export const ProjectEntry = cvScope.ProjectEntry;
export type ProjectEntry = typeof ProjectEntry.infer;

export const CVProfile = cvScope.CVProfile;
export type CVProfile = typeof CVProfile.infer;

export const CVData = cvScope.CVData;
export type CVData = typeof CVData.infer;
