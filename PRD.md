# PRD: hagerf-cv

## Problem Statement

Developers and professionals need a polished, self-hostable CV platform that lets them manage structured CV data once and publish it in multiple contexts: a public web page, a print-ready PDF, and an embeddable React component in their own apps. Existing solutions either lock data into a proprietary SaaS with no programmatic access, or require building everything from scratch. There is no open, composable CV platform that offers a great hosted default while allowing full self-hosting and developer embedding.

## Solution

Build **hagerf-cv** — an open-source, self-hostable CV platform consisting of:

1. **A hosted SaaS web app** (`cv.hagerf.se`) built with TanStack Start where authenticated users manage a shared profile (master data) and publish multiple tailored CV documents with per-CV section visibility, ordering, theme, and format config.
2. **A public share page** that renders any CV marked public, identical to the print preview — WYSIWYG between screen and Cmd+P output.
3. **An NPM package** (`hagerf-cv`) that lets developers fetch and render a CV in their own React apps with a single import.
4. A **monorepo** structure so the rendering logic is shared between the web app and the NPM package, ensuring pixel-identical output in all contexts.

The default hosted instance (`cv.hagerf.se`) is the canonical public product. Developers may self-host an identical instance under the MIT + Attribution license, which requires a visible "Powered by hagerf-cv" link in the app footer.

## User Stories

### Authentication & Onboarding

1. As a new user, I want to sign in with my GitHub account, so that I can access the platform without creating a new password.
2. As a new user, I want to sign in with my Google account, so that I have an alternative to GitHub OAuth.
3. As a new user, I want a profile row created automatically on first login, so that I can immediately start filling in my data without a separate signup step.
4. As a returning user, I want my session to persist across page reloads, so that I am not forced to log in repeatedly.
5. As a user, I want to log out, so that I can secure my account on shared devices.

### Profile Management

6. As a user, I want to enter my name, headline, bio, email, and location in a single profile form, so that this master data is available to all my CVs.
7. As a user, I want to upload a profile photo, so that my CV has a professional appearance.
8. As a user, I want to add links to LinkedIn, GitHub, Twitter/X, YouTube, and custom URLs, so that recruiters can find my online presence.
9. As a user, I want my profile changes to be reflected immediately across all CVs that reference it, so that I only update data in one place.
10. As a user, I want to edit my profile at any time from a dedicated profile page, so that my master data is always up to date.

### Work Experience

11. As a user, I want to add work experience entries with company, role, start date, end date, description, and bullet points, so that my employment history is structured.
12. As a user, I want to mark an end date as blank to indicate a current role, so that "Present" is shown automatically.
13. As a user, I want to reorder work experience entries via drag-and-drop, so that I control the display order.
14. As a user, I want to edit or delete any work experience entry, so that my history stays accurate.

### Education

15. As a user, I want to add education entries with institution, degree, field of study, start date, and end date, so that my academic background is captured.
16. As a user, I want to reorder education entries, so that I control which degree appears first.
17. As a user, I want to edit or delete any education entry, so that my data stays accurate.

### Skills

18. As a user, I want to group skills into named categories (e.g. "Languages", "Tools"), so that my skills section is readable and organized.
19. As a user, I want to add multiple skill items per category, so that I can list technologies precisely.
20. As a user, I want to reorder skill categories, so that the most relevant skills appear first.
21. As a user, I want to edit or delete any skill category or item, so that outdated skills can be removed.

### Projects

22. As a user, I want to add projects with title, URL, and description, so that my portfolio work is highlighted.
23. As a user, I want to reorder projects, so that the most impressive ones appear first.
24. As a user, I want to edit or delete any project entry, so that my project list stays current.

### CV Document Management

25. As a user, I want to create multiple CV documents (up to 10), so that I can tailor my CV for different roles or audiences.
26. As a user, I want to give each CV document a label (e.g. "Frontend Role", "Senior PM"), so that I can identify them at a glance from the dashboard.
27. As a user, I want to see all my CV documents listed on a dashboard, so that I have an overview of all versions.
28. As a user, I want to be prevented from creating more than 10 CV documents, with a clear error message, so that the system limit is communicated.
29. As a user, I want to delete a CV document, so that I can remove versions I no longer need.
30. As a user, I want to duplicate an existing CV document, so that I can start a new version from an existing configuration.

### CV Configuration

31. As a user, I want to choose between A4 and Letter page formats per CV document, so that my CV prints correctly for my target region.
32. As a user, I want to choose between the "minimal" and "compact" themes per CV, so that the visual style matches the role I am applying for.
33. As a user, I want to show or hide any section (summary, work, education, skills, projects, links) per CV, so that irrelevant sections are excluded.
34. As a user, I want to reorder sections within a CV, so that I can lead with the most relevant content.
35. As a user, I want to select which specific work experience entries, education entries, and projects are included per CV, so that I can present only the relevant subset.
36. As a user, I want to write a summary override per CV that replaces my profile bio, so that I can tailor the opening paragraph for each application.

### Preview & Print

37. As a user, I want to preview my CV in the browser exactly as it will print, so that I have WYSIWYG confidence before sharing.
38. As a user, I want to trigger a browser print dialog from the preview page, so that I can save the CV as a PDF via Cmd+P / Ctrl+P.
39. As a user, I want the printed output to match the preview with no margin shifts or layout changes, so that the PDF looks professional.
40. As a user, I want multi-page CVs to break cleanly between sections without cutting content mid-block, so that long CVs are readable.

### Sharing & Public Access

41. As a user, I want to toggle a CV as public or private, so that I control who can see it.
42. As a user, I want a unique shareable URL generated for each CV (`/share/:token`), so that I can send a link to a recruiter.
43. As a user, I want to regenerate the share token for a CV, so that I can revoke access to a previously shared link.
44. As a user, I want private CVs to return a 404 on the public share URL, so that unauthorised viewers cannot access my data.
45. As a user, I want the public share page to render identically to my preview, so that what I designed is what the recruiter sees.
46. As a user, I want to copy the share URL to my clipboard from the CV editor, so that sharing is a single action.

### Analytics

47. As a user, I want to see how many times my public CV has been viewed, so that I can gauge recruiter interest.
48. As a user, I want pageview counts to update in near real-time, so that the data is current when I check.
49. As a user, I want pageviews recorded anonymously (no PII stored), so that visitor privacy is respected.
50. As a user, I want analytics displayed per CV document on the dashboard, so that I can compare engagement across versions.

### NPM Package (Developer)

51. As a developer, I want to install `hagerf-cv` from npm and render a full CV with `<CV data={data} />`, so that I can embed a CV in my portfolio site without building a renderer.
52. As a developer, I want to fetch CV data with `fetchCV({ token, apiUrl })`, so that I can retrieve a public CV from any hagerf-cv instance programmatically.
53. As a developer, I want the `fetchCV` helper to validate the response against the ArkType schema, so that I get a type error at runtime if the API returns unexpected data.
54. As a developer, I want to render a compact `<CVCard data={data} />` widget, so that I can embed a profile card in a sidebar or landing page.
55. As a developer, I want to point `apiUrl` at my own self-hosted instance, so that I am not dependent on the hosted SaaS.
56. As a developer, I want TypeScript types exported from the package, so that I get autocompletion when constructing or transforming `CVData`.
57. As a developer, I want the package to be tree-shakeable, so that consumers only bundle what they import.

### Self-Hosting

58. As a developer, I want a published Docker image and `docker-compose.yml` example, so that I can self-host in minutes.
59. As a developer, I want a `.env.example` with all required environment variables documented, so that I know exactly what to configure.
60. As a developer, I want the self-hosted instance to be functionally identical to the hosted SaaS, so that I do not lose features by self-hosting.
61. As a developer, I want the self-hosted app footer to display "Powered by hagerf-cv" with a link to the original project (required by the license), so that attribution is maintained.

---

## Implementation Decisions

### Monorepo & Toolchain
- **pnpm workspaces + Turborepo** for the monorepo, TypeScript throughout.
- Three packages: `apps/web`, `packages/cv-renderer`, `packages/hagerf-cv`.
- Shared ESLint + tsconfig at the root.

### Database & ORM
- **Supabase** for Auth (GitHub + Google OAuth), Storage (avatar uploads), and hosted Postgres.
- **Drizzle ORM** with a direct Postgres connection string for all DB queries (type-safe, schema-driven). Supabase JS client used only for Auth and Storage, not for data queries.
- Drizzle migrations committed to the repo; applied on deploy.
- **ArkType** for runtime validation at all data boundaries (API responses, `sections_config` JSON, `CVData` shape).

### Schema
- Tables: `profiles`, `work_experiences`, `education`, `skills`, `projects`, `cv_documents`, `cv_views`.
- `cv_documents.sections_config` is a `jsonb` column validated by ArkType on read/write.
- 10 CV document limit enforced at the application layer (server function checks count) AND as a DB check constraint.
- `cv_views` table: `id`, `cv_document_id` (FK), `viewed_at` (timestamptz). No IP or user-agent stored.
- Supabase Row Level Security (RLS) policies enforce per-user data isolation.

### Auth
- GitHub and Google OAuth via Supabase Auth.
- Session stored in cookies (SSR-compatible with TanStack Start).
- TanStack Start middleware enforces auth on protected routes.
- On first login, a `profiles` row is created if one does not exist (idempotent upsert).

### cv-renderer Package
- Exports: `CVDocument`, `CVCard`, `themes`, and ArkType-derived TypeScript types (`CVData`, `CVFormat`, `CVTheme`, `CVSectionType`).
- `CVDocument` renders a fixed-dimension container matching A4 (210×297mm) or Letter (216×279mm).
- `@media print` CSS hides everything except `.cv-document`, removes margins, forces exact page size.
- CSS `break-inside: avoid` on section blocks for multi-page output.
- Two themes: `minimal` (single column, serif accent) and `compact` (two-column sidebar layout).
- No runtime dependencies beyond React and Tailwind.

### hagerf-cv NPM Package
- Thin re-export wrapper: `CV` (alias for `CVDocument`), `CVCard`, `fetchCV`, and types.
- `fetchCV({ token, apiUrl })` calls `GET {apiUrl}/api/cv/{token}` and validates the response with ArkType before returning.
- Published to npm; versioned with [Changesets](https://github.com/changesets/changesets).

### Web App Routes & Server Functions
- TanStack Start with `createServerFn` for all data mutations.
- Public routes: `/`, `/auth/callback`, `/share/:token`, `/api/cv/:token`.
- Protected routes: `/dashboard`, `/profile`, `/cv/:id`, `/cv/:id/preview`.
- `GET /api/cv/:token` returns `CVData` JSON for public CVs only; private CVs return 404.

### Photo Upload
- Client uploads directly to Supabase Storage bucket `avatars/{user_id}/*`.
- Bucket policy: authenticated write, public read.
- Server function updates `profiles.photo_url` post-upload.

### Analytics
- Every request to `/share/:token` and `/api/cv/:token` for a public CV inserts a row into `cv_views`.
- Aggregate count query (`COUNT(*) WHERE cv_document_id = ?`) shown on the dashboard and CV editor.
- No caching initially; can be cached at the Cloudflare edge later if needed.

### Rate Limiting & Security
- The self-hosted Dokploy instance is fronted by Cloudflare, which handles DDoS protection and rate limiting on the public endpoints.
- No application-level rate limiting in v1.

### CI/CD
- **GitHub Actions** on merge to `main`:
  1. Run all tests.
  2. Build (`pnpm turbo build`).
  3. POST to Dokploy deploy webhook (web app).
  4. If `packages/hagerf-cv` has a pending Changeset, run `changeset publish` to npm.
- Changesets manages version bumps and changelog entries for the npm package.

### Docker & Deployment
- Multi-stage Dockerfile: `deps` → `build` → `runtime` (node:22-alpine).
- Output: `apps/web/.output` (TanStack Start Nitro output).
- Required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PUBLIC_BASE_URL`, `DATABASE_URL` (direct Postgres for Drizzle).

### License
- MIT + Attribution Clause: self-hosters must display a visible "Powered by hagerf-cv" link in the app footer pointing to the original project.

---

## Testing Decisions

### What makes a good test
- Tests exercise **external behavior** (inputs → outputs, side effects) not implementation details.
- Tests use real dependencies (real Postgres, real ArkType schemas) — no mocking the database.
- Each test is independent and leaves no persistent state (transactional rollback or per-test DB reset).

### Unit Tests — `packages/cv-renderer` (Jest + React Testing Library)
- ArkType schema validation: valid inputs parse correctly, invalid inputs produce typed errors.
- `CVDocument` renders the correct sections given a `CVData` fixture.
- `CVCard` renders profile name, headline, and links.
- Theme application: `minimal` and `compact` themes apply the correct class names.
- Section ordering and visibility: hidden sections are absent from the render output.
- `included_ids` filtering: only the specified entries appear.
- A4 vs Letter: the container has the correct dimensions for each format.

### Unit Tests — `packages/hagerf-cv` (Jest)
- `fetchCV` returns a valid `CVData` object when the mock HTTP server returns well-formed JSON.
- `fetchCV` throws a typed ArkType error when the server returns malformed data.
- `fetchCV` throws when the server returns a non-200 status.

### Integration Tests — `apps/web` server functions (Jest + Drizzle + Docker Postgres)
- A local Postgres instance is spun up via Docker Compose for the test suite.
- Drizzle migrations are applied before the suite runs.
- `upsertProfile` creates a new profile row on first call and updates on subsequent calls.
- `createCV` succeeds up to 10 documents and rejects the 11th with a limit error.
- `getPublicCV` returns data for a public CV and 404 for a private CV.
- `regenerateShareToken` makes the old token return 404 and the new token return data.
- Pageview insertion: a `cv_views` row is created when a public CV is accessed.
- `getCV` returns the correct `CVData` with section filtering applied.
- RLS: a user cannot read or mutate another user's data.

### Test approach
- TDD red-green: write a failing test first, then implement the minimum code to make it pass.
- No Playwright / E2E tests in v1.

---

## Out of Scope

- WordPress embed tag / iFrame embeds.
- Support for non-React frameworks in the NPM package (planned for a later version).
- Server-side PDF generation (Playwright/Puppeteer); print-to-PDF via browser is the only PDF story.
- Email/password authentication.
- Third-party analytics services (Plausible, Umami, etc.).
- Invite-only or team/org accounts.
- CV templates beyond `minimal` and `compact`.
- Custom domain support for public CV share pages.
- Application-level rate limiting (delegated to Cloudflare).
- Paid tiers or billing.

---

## Further Notes

- The `share_token` is a nanoid generated server-side; it is the only secret protecting a public CV. Regenerating it is the revocation mechanism.
- `summary_override` on `cv_documents` allows per-CV tailoring of the opening paragraph without touching the master `profiles.bio`.
- The `sort_order` column on all child tables (work, education, skills, projects) is managed by the app layer; drag-and-drop in the UI writes the new order back.
- The `hagerf-cv` npm package intentionally has no opinion on styling beyond what `cv-renderer` provides — consumers import the component and the CSS, nothing else.
- Self-hosted and SaaS instances are code-identical; the only enforced difference is the attribution footer link required by the license.
- The Changeset workflow means npm releases are opt-in per PR: a contributor must add a changeset file for the package version to be bumped and published.
