import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.uid()
  name: text("name"),
  headline: text("headline"),
  bio: text("bio"),
  email: text("email"),
  location: text("location"),
  photo_url: text("photo_url"),
  links: jsonb("links").default(sql`'[]'::jsonb`),
  ...timestamps,
});

export const work_experiences = pgTable(
  "work_experiences",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    start_date: text("start_date"),
    end_date: text("end_date"),
    description: text("description"),
    bullets: jsonb("bullets").default(sql`'[]'::jsonb`),
    sort_order: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("work_experiences_user_id_idx").on(t.user_id)],
);

export const education = pgTable(
  "education",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    degree: text("degree"),
    field_of_study: text("field_of_study"),
    start_date: text("start_date"),
    end_date: text("end_date"),
    sort_order: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("education_user_id_idx").on(t.user_id)],
);

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    items: jsonb("items").default(sql`'[]'::jsonb`),
    sort_order: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("skills_user_id_idx").on(t.user_id)],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url"),
    description: text("description"),
    sort_order: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("projects_user_id_idx").on(t.user_id)],
);

export const cv_documents = pgTable(
  "cv_documents",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    share_token: text("share_token").notNull().unique(),
    is_public: boolean("is_public").notNull().default(false),
    format: text("format").notNull().default("a4"),
    theme: text("theme").notNull().default("minimal"),
    summary_override: text("summary_override"),
    sections_config: jsonb("sections_config").notNull().default(sql`'[]'::jsonb`),
    ...timestamps,
  },
  (t) => [
    index("cv_documents_user_id_idx").on(t.user_id),
    uniqueIndex("cv_documents_share_token_idx").on(t.share_token),
    // Per-user row limit (max 10) is enforced by a BEFORE INSERT trigger defined in the migration,
    // because PostgreSQL does not allow subqueries in CHECK constraints.
  ],
);

export const cv_views = pgTable(
  "cv_views",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    cv_document_id: uuid("cv_document_id")
      .notNull()
      .references(() => cv_documents.id, { onDelete: "cascade" }),
    viewed_at: timestamp("viewed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("cv_views_cv_document_id_idx").on(t.cv_document_id)],
);
