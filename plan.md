# Dapper CV — Implementation Plan

## Context

Build a self-hostable, open source CV platform called **hagerf-cv** consisting of:
1. A web service (TanStack Start) where authenticated users manage their CV data and publish CVs
2. An NPM package (`hagerf-cv`) that lets developers embed a CV component in their own apps

The system uses a hybrid data model: a shared profile holds master data, and individual CV documents reference + filter it with per-CV config.

---

## Monorepo Structure

```
hagerf-cv/
├── apps/
│   └── web/                        # TanStack Start app
├── packages/
│   ├── cv-renderer/                # Shared rendering logic (used by both web + npm pkg)
│   └── hagerf-cv/                  # Published NPM package
├── docker/
│   └── Dockerfile                  # Multi-stage build for Dokploy
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── .env.example
```

**Toolchain:** pnpm workspaces + Turborepo, TypeScript throughout, ArkType for runtime validation at all data boundaries.

---

## Database Schema (Supabase / Postgres)

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK | = auth.users.id |
| name | text | |
| headline | text | job title / tagline |
| bio | text | master summary |
| email | text | |
| location | text | |
| photo_url | text | Supabase Storage URL |
| links | jsonb | `{ linkedin, github, twitter, youtube, custom[] }` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `work_experiences`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| company | text | |
| role | text | |
| start_date | date | |
| end_date | date | nullable = current |
| description | text | |
| bullets | text[] | |
| sort_order | int | |

### `education`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| institution | text | |
| degree | text | |
| field | text | |
| start_date | date | |
| end_date | date | |
| sort_order | int | |

### `skills`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| category | text | e.g. "Languages", "Tools" |
| items | text[] | |
| sort_order | int | |

### `projects`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| title | text | |
| url | text | |
| description | text | |
| sort_order | int | |

### `cv_documents`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles | |
| title | text | user-facing label e.g. "Frontend Role" |
| share_token | text UNIQUE | nanoid, used for public access |
| is_public | boolean | default false |
| format | text | `'A4' \| 'Letter'` |
| theme | text | `'minimal' \| 'compact'` |
| sections_config | jsonb | ordering, visibility, per-section overrides |
| summary_override | text | nullable, replaces profile bio for this CV |
| created_at | timestamptz | |
| updated_at | timestamptz | |

`sections_config` shape (ArkType-validated):
```ts
{
  sections: Array<{
    type: 'header' | 'summary' | 'work' | 'education' | 'skills' | 'projects' | 'links',
    visible: boolean,
    sort_order: number,
    included_ids?: string[]  // which work/education/project entries to show
  }>
}
```

---

## packages/cv-renderer

Shared rendering logic used by both the web app and the NPM package.

### Exports
```ts
// Types (ArkType schemas + inferred types)
export type { CVData, CVFormat, CVTheme, CVSectionType }

// Components
export { CVDocument }   // full-page A4/Letter CV
export { CVCard }       // compact profile card (screen-only)

// Themes
export { themes }       // theme registry: 'minimal' | 'compact'
```

### CVData type (ArkType)
```ts
const CVData = type({
  profile: {
    name: 'string',
    headline: 'string',
    bio: 'string?',
    email: 'string?',
    location: 'string?',
    photoUrl: 'string?',
    links: { ... }
  },
  sections: 'CVSection[]',
  format: "'A4' | 'Letter'",
  theme: "'minimal' | 'compact'",
})
```

### Print CSS strategy
- CVDocument renders a fixed-dimension container matching A4 (210×297mm) or Letter (216×279mm)
- `@media print` CSS: hide everything except `.cv-document`, remove margins, force exact page size
- Preview in browser shows the same container at screen scale — WYSIWYG
- Multi-page handled via CSS `break-inside: avoid` on section blocks

### Themes
Each theme is a Tailwind config object + layout variant:
- `minimal` — single column, generous whitespace, serif accent font
- `compact` — two-column (sidebar for skills/links, main for work/education), tight spacing

---

## packages/hagerf-cv (NPM package)

Thin wrapper around `cv-renderer` + a fetch helper.

### Package exports
```ts
// Components (re-exported from cv-renderer)
export { CVDocument as CV } from '@hagerf-cv/renderer'
export { CVCard } from '@hagerf-cv/renderer'

// Fetch helper
export async function fetchCV(opts: {
  token: string
  apiUrl: string
}): Promise<CVData>

// Types
export type { CVData, CVFormat, CVTheme }
```

### Consumer usage
```tsx
import { CV, CVCard, fetchCV } from 'hagerf-cv'

// Server-side fetch
const data = await fetchCV({ token: 'tok_abc', apiUrl: 'https://cv.example.com' })

// Render full CV
<CV data={data} />

// Render card widget
<CVCard data={data} />
```

### API endpoint the helper calls
`GET /api/cv/:token` → returns `CVData` JSON (unauthenticated, public CVs only)

---

## apps/web — TanStack Start App

### Routes
| path | auth | purpose |
|---|---|---|
| `/` | public | landing page |
| `/auth/callback` | public | GitHub OAuth callback |
| `/dashboard` | required | list all user CVs |
| `/profile` | required | edit shared profile (master data) |
| `/cv/$id` | required | edit CV (sections, theme, format, visibility) |
| `/cv/$id/preview` | required | WYSIWYG print preview |
| `/share/$token` | public | public CV render page |
| `/api/cv/$token` | public | JSON endpoint for NPM fetchCV helper |

### Server functions (TanStack Start `createServerFn`)
- `getProfile()` — fetch authenticated user's profile
- `upsertProfile(data)` — create/update profile
- `listCVs()` — list user's CV documents
- `getCV(id)` — fetch CV document + resolved data
- `createCV(data)` — create new CV document
- `updateCV(id, data)` — update CV config
- `deleteCV(id)` — delete CV
- `getPublicCV(token)` — fetch public CV by share token (no auth)
- `regenerateShareToken(id)` — generate new share token

### Auth flow
- GitHub OAuth via Supabase Auth
- Supabase session stored in cookies (SSR-compatible)
- TanStack Start middleware checks session on protected routes
- On first login: create profile row if not exists

### Photo upload
- Client uploads directly to Supabase Storage bucket `avatars`
- Bucket policy: `authenticated` can upload to `avatars/{user_id}/*`, public read
- Server function updates `profiles.photo_url` after upload

---

## Docker Build (Dokploy)

Multi-stage Dockerfile:
```dockerfile
# Stage 1: deps
FROM node:22-alpine AS deps
RUN corepack enable pnpm
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/cv-renderer/package.json packages/cv-renderer/
COPY packages/hagerf-cv/package.json packages/hagerf-cv/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Stage 2: build
FROM deps AS build
COPY . .
RUN pnpm turbo build --filter=web

# Stage 3: runtime
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=build /app/apps/web/.output ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/index.mjs"]
```

Environment variables required:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PUBLIC_BASE_URL=
```

---

## Implementation Order

1. **Monorepo scaffold** — pnpm workspaces, Turborepo, root tsconfig, shared eslint
2. **packages/cv-renderer** — ArkType schemas, CVDocument + CVCard components, minimal + compact themes, print CSS
3. **apps/web — Supabase setup** — auth (GitHub OAuth), RLS policies, storage bucket
4. **apps/web — profile CRUD** — `/profile` route + server functions
5. **apps/web — CV document CRUD** — `/dashboard`, `/cv/$id` routes
6. **apps/web — preview + share** — `/cv/$id/preview`, `/share/$token`, `/api/cv/$token`
7. **packages/hagerf-cv** — wrap renderer, implement `fetchCV`, publish config
8. **Dockerfile + CI** — multi-stage build, `.env.example`, self-hosting docs

---

## Verification

- `/share/:token` renders identically to `/cv/:id/preview` and to Cmd+P print output
- `fetchCV({ token, apiUrl })` returns valid `CVData` parseable by ArkType schema
- `<CV data={data} />` renders without error in a standalone Vite React app (consumer test)
- `<CVCard data={data} />` renders the compact card
- Private CVs return 404 on `/share/:token` and `/api/cv/:token`
- Revoking share token (regenerate) makes old token 404
- Docker image builds and runs: `docker build -t hagerf-cv . && docker run -p 3000:3000 hagerf-cv`
- GitHub OAuth login flow completes and creates profile row
