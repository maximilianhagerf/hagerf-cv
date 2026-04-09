export {
  CVDocument as CV,
  CVCard,
  CVFormat,
  CVTheme,
  CVSectionType,
  SectionConfig,
  ProfileLink,
  WorkEntry,
  EducationEntry,
  SkillEntry,
  ProjectEntry,
  CVProfile,
  CVData,
} from "@hagerf-cv/renderer";

export type {
  CVDocumentProps,
  CVCardProps,
  CVFormatType,
  CVThemeType,
  CVSectionTypeType,
  SectionConfigType,
  ProfileLinkType,
  WorkEntryType,
  EducationEntryType,
  SkillEntryType,
  ProjectEntryType,
  CVProfileType,
  CVDataType,
  ThemeKey,
  ThemeClasses,
} from "@hagerf-cv/renderer";

export { fetchCV } from "./fetchCV.js";
export type { FetchCVOptions } from "./fetchCV.js";
