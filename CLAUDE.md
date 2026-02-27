# CLAUDE.md — Diesel-X Project Guide

This file provides context for AI agents (Claude Code, Copilot, Cursor, etc.) working on the Diesel-X codebase. Read this before making any changes.

## What This Project Is

Diesel-X is a fleet maintenance management web app. Companies that service heavy equipment (excavators, trucks, loaders) use it to track equipment, schedule maintenance, and manage repair workflows. The key differentiator is a public QR code portal — anyone on-site scans a unit's QR sticker to run pre-start checks or report issues, no login needed.

Read `Diesel-X_PRD.md` in the project root for the full product requirements document. It is the source of truth for all feature behavior.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL hosted on Supabase
- **ORM:** Drizzle ORM (SQL-like query builder, schema in `src/lib/db/schema/`)
- **Auth:** Supabase Auth (email/password, magic links, invitations)
- **File Storage:** Supabase Storage (photos, videos, equipment images)
- **Realtime:** Supabase Realtime (notifications, live status updates)
- **UI:** shadcn/ui + Tailwind CSS
- **Email:** Resend + React Email
- **SMS:** Twilio
- **PDF:** @react-pdf/renderer
- **Background Jobs:** Inngest
- **QR Codes:** qrcode (npm)
- **Calendar:** @fullcalendar/react

### Hosting & Deployment

- **Server:** Digital Ocean Droplet (Ubuntu)
- **Reverse Proxy:** Nginx (handles SSL, gzip, static asset caching, WebSocket upgrades)
- **Process Manager:** PM2 (cluster mode, auto-restart, zero-downtime reloads)
- **SSL:** Let's Encrypt via Certbot (auto-renewed)
- **App location:** `/var/www/diesel-x`
- **PM2 config:** `ecosystem.config.js` in project root
- **Nginx config:** `/etc/nginx/sites-available/diesel-x`
- **Deploy script:** `deploy.sh` in project root — pulls, installs, migrates, builds, reloads PM2

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, signup, invite acceptance
│   ├── (dashboard)/        # All authenticated routes
│   │   ├── dashboard/
│   │   ├── equipment/[equipmentId]/
│   │   ├── schedule/
│   │   ├── mechanics/
│   │   ├── customers/
│   │   ├── services/
│   │   ├── tasks/[taskId]/
│   │   ├── notifications/
│   │   └── settings/
│   ├── qr/[equipmentId]/     # Public QR portal (NO auth)
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui primitives (do not modify without reason)
│   ├── dashboard/
│   ├── equipment/
│   ├── tasks/
│   ├── schedule/
│   ├── qr/
│   └── shared/
├── lib/
│   ├── supabase/           # Supabase clients (browser, server, middleware)
│   ├── db/
│   │   ├── schema/         # Drizzle schema files (source of truth for DB)
│   │   ├── queries/        # Reusable query functions
│   │   └── index.ts        # Drizzle client instance
│   ├── inngest/            # Background job definitions
│   ├── email/templates/    # React Email templates
│   ├── sms/
│   ├── pdf/                # PDF report templates (JSX)
│   └── utils/
├── hooks/                  # Custom React hooks
└── middleware.ts           # Auth + org context middleware
```

## Critical Rules

### Authentication & Authorization

- **The `/qr/*` routes are PUBLIC.** Never add auth middleware or session checks to these routes. Anyone scanning a QR code must be able to use the portal without logging in.
- **All `/(dashboard)/*` routes require authentication.** The middleware in `src/middleware.ts` handles this.
- **Every database query in authenticated routes must be scoped to the current organization.** Never return data across orgs. The current org ID comes from the session/context.
- **Enforce role-based access in both the UI and the API layer.** Don't rely on hiding UI elements alone — always validate permissions server-side.
- The five roles are: `owner`, `admin`, `mechanic`, `customer`, `viewer`. Their permissions are defined in the PRD.
- Mechanics and Viewers have **equipment visibility scoping** — they may only see a subset of equipment. Always apply visibility filters in queries for these roles.
- Customers can **only** see their own equipment and tasks. Never leak other customers' data.

### Database & Schema

- **Drizzle schema files in `src/lib/db/schema/` are the source of truth** for the database structure. When changing the schema, edit these files and run `pnpm db:push` or `pnpm db:generate`.
- **Always scope queries by `organizationId`.** This is a multi-tenant app. A missing org filter is a data leak.
- Use Drizzle's query builder — do not write raw SQL unless absolutely necessary.
- Use Supabase RLS policies as a safety net, but do not rely on them as the sole access control mechanism. Enforce access in application code too.
- Foreign keys and cascading deletes should be defined in the Drizzle schema, not managed manually.

### Task Lifecycle

The task workflow is the core of the app. The valid status transitions are:

```
created → approved → prepared → assigned → accepted → in_progress → completed
```

Additional valid transitions:
- Any status → `completed` (admin override)
- Any status → `not_approved` (admin override)
- `completed` → `created` (mechanic flags additional work needed)

**Do not allow invalid status transitions.** Validate transitions server-side. The valid transitions should be defined in a shared constant or utility, not hardcoded in multiple places.

When a **breakdown task is completed**, automatically set the equipment's operating status back to `up`. When a **breakdown is reported**, set the equipment to `down`.

When a **pre-start or service checklist item is failed**:
- Standard item → auto-create a **defect** task
- Critical item → auto-create a **breakdown** task and set equipment to `down`

### QR Portal Specifics

- The QR portal must be **mobile-first**. Design for phone screens.
- The portal **remembers the operator's name and phone number** via a browser cookie. Check for this cookie and pre-fill the form fields.
- When entering equipment hours/km, validate against the last recorded value. If the difference is abnormally large (much higher or lower), show a confirmation prompt.
- Pre-start checks, defect reports, and breakdown reports must work **without JavaScript** as much as possible — progressive enhancement. These are used on job sites with poor connectivity.
- Media uploads (photos up to 5, videos up to 2, max 2 min each) go to Supabase Storage. Use presigned URLs for direct upload from the client.
- **Defect/breakdown reports** submitted via the QR portal are stored in the `qr_defect_reports` table with their media in `qr_defect_report_media`. The `is_equipment_down` boolean determines whether the submission creates a breakdown task (equipment set to down) or a defect task. A task is always auto-created in the `tasks` table and linked back via `generated_task_id`.
- Keep QR defect report media (`qr_defect_report_media`) separate from task media (`task_media`). QR media is the operator's original uploads at time of reporting; task media is added by mechanics during repair.
- **Pre-start media** is attached to individual failed checklist items via `prestart_submission_item_media`, not to the submission as a whole. Only show the media upload UI when an item is marked as failed. This media is separate from both QR defect report media and task media.

### UI & Components

- **Use shadcn/ui components from `src/components/ui/`.** These are the base primitives. Do not install alternative component libraries.
- **Use Tailwind CSS for all styling.** No CSS modules, styled-components, or inline style objects.
- Keep components small and composable. Feature-specific components go in their feature folder under `src/components/`.
- Use Server Components by default. Only add `"use client"` when the component needs interactivity (state, effects, event handlers, browser APIs).
- Forms should use Server Actions where possible. For complex multi-step forms (like the pre-start checklist), client-side state is fine.
- The dashboard layout is desktop-oriented. The QR portal is mobile-first. Both must be responsive.

### Data Fetching

- Fetch data in Server Components using Drizzle queries. Pass data down as props.
- For mutations, use Server Actions (defined in `actions.ts` files colocated with the route, or in `src/lib/actions/`).
- For realtime updates (notification bell, live task status), use Supabase Realtime subscriptions in client components.
- Never fetch data on the client that could be fetched on the server. Client-side fetching is only for realtime subscriptions and interactive filtering that can't wait for a page reload.

### Background Jobs (Inngest)

- All background job functions live in `src/lib/inngest/functions/`.
- The Inngest webhook handler is at `src/app/api/inngest/route.ts`.
- Key background jobs:
  - **Automatic maintenance task creation** — periodically checks equipment hours/km against service template thresholds and creates tasks when the creation threshold is reached.
  - **Notification dispatch** — sends emails (Resend) and SMS (Twilio) for task status changes, approvals, and completed reports.
  - **Report delivery** — generates PDF and emails it to the customer when a service sheet or field report is completed.
- Keep job functions idempotent. They may be retried on failure.

### Email & SMS

- Email templates are React components in `src/lib/email/templates/`. Use React Email syntax.
- The send helper is in `src/lib/email/send.ts` (wraps Resend).
- SMS is sent via Twilio for customer approval requests. The helper is in `src/lib/sms/send.ts`.
- Never send emails or SMS synchronously in request handlers. Always dispatch via Inngest background jobs.

### PDF Generation

- PDF templates for service sheets and field reports are React components in `src/lib/pdf/`.
- They use `@react-pdf/renderer` — these are JSX components that render to PDF, not HTML.
- PDFs should be branded (company logo, consistent styling).
- Generate PDFs on the server via API routes in `src/app/api/pdf/`.

### File Naming Conventions

- **Files and folders:** kebab-case (`equipment-detail.tsx`, `time-logs.ts`)
- **React components:** PascalCase exports (`EquipmentDetail`, `TaskCard`)
- **Utilities and helpers:** camelCase exports (`formatHours`, `validateTransition`)
- **Schema files:** singular noun, kebab-case (`equipment.ts`, `time-logs.ts`)
- **Drizzle tables:** snake_case (`equipment`, `task_assignments`, `time_logs`)
- **TypeScript types:** PascalCase, no `I` prefix (`Equipment`, `TaskStatus`, `UserRole`)

### Error Handling

- Use try/catch in Server Actions and API routes. Return typed error objects, not thrown exceptions, to the client.
- Display user-friendly error messages via toast notifications (use shadcn/ui `Sonner` or `Toast`).
- Log errors server-side with enough context to debug (org ID, user ID, action attempted).
- For form validation, use `zod` schemas. Validate on both client (for UX) and server (for security).

### Testing

- Place test files next to the code they test (`equipment-detail.test.tsx` next to `equipment-detail.tsx`).
- Use Vitest for unit tests and Playwright for E2E tests.
- Critical paths that must have test coverage:
  - Task status transitions
  - Role-based access control checks
  - QR portal submission flow
  - Automatic maintenance task creation logic
  - Hour/km validation logic

## Common Patterns

### Adding a New Page

1. Create the route folder under `src/app/(dashboard)/your-page/`
2. Add `page.tsx` as a Server Component that fetches data via Drizzle
3. Create feature components in `src/components/your-feature/`
4. Add Server Actions for mutations in `actions.ts` colocated with the route
5. Update navigation in the shared layout if it's a main tab

### Adding a New Database Table

1. Create a new schema file in `src/lib/db/schema/` (e.g., `parts.ts`)
2. Export the table and any relations from `src/lib/db/schema/index.ts`
3. Run `pnpm db:push` to apply changes to the database
4. Add RLS policies in Supabase dashboard if using RLS
5. Create query functions in `src/lib/db/queries/`

### Adding a New Background Job

1. Define the function in `src/lib/inngest/functions/`
2. Register it in the Inngest serve handler at `src/app/api/inngest/route.ts`
3. Trigger it by sending an event from a Server Action or another Inngest function
4. Keep the function idempotent — it may be retried

### Adding a New Email Template

1. Create a React Email component in `src/lib/email/templates/`
2. Add a send function or extend the existing helper in `src/lib/email/send.ts`
3. Trigger the send via an Inngest background job, never inline in a request

### Deploying Changes

1. Push changes to `main` branch
2. SSH into the droplet and run `./deploy.sh`
3. The script pulls, installs deps, runs migrations, builds, and does a zero-downtime PM2 reload
4. Check `pm2 logs diesel-x` if anything looks wrong
5. Never run `pnpm dev` on the production server — always `pnpm build` then `pm2 reload`

## Things to Watch Out For

- **Multi-tenancy leaks:** Every query must filter by org. If you're writing a new query and it doesn't include `where organizationId = ...`, stop and fix it.
- **QR portal auth:** Never add auth checks to `/qr/*` routes. This is intentionally public.
- **Task auto-creation loops:** When a failed checklist item auto-creates a task, make sure it doesn't trigger another checklist or create duplicate tasks. Use idempotency keys.
- **Hour/km validation:** The QR portal validates equipment readings against the last known value. Don't skip this — bad readings cascade into wrong service scheduling.
- **File upload size:** Videos are capped at 2 minutes. Enforce this both client-side (before upload) and server-side (reject oversized files). Nginx is configured with `client_max_body_size 100M` — if you increase upload limits, update the Nginx config too.
- **Role escalation:** Never trust client-side role checks alone. A mechanic shouldn't be able to hit an admin API endpoint by crafting a request manually.
- **QR defect reports vs tasks:** A QR defect report submission always creates a corresponding task. Don't create the task without the `qr_defect_reports` record, and don't forget to set `generated_task_id` on the report. If `is_equipment_down` is true, the equipment's `operating_status` must be set to `down` and the task type must be `breakdown`.
- **PM2 cluster mode:** The app runs in cluster mode across all CPUs. This means you cannot store state in memory across requests — all shared state must live in the database or Supabase Realtime. If you add a WebSocket or SSE endpoint, make sure it works across multiple Node.js instances.
- **Nginx and WebSockets:** The Nginx config includes `Upgrade` and `Connection` headers for WebSocket support (needed for Supabase Realtime). If you add a new real-time endpoint, it will work through the proxy without changes.
- **Environment variables on the server:** Production env vars live in `/var/www/diesel-x/.env.local`. When adding new env vars, update both `.env.example` in the repo and the production `.env.local` on the droplet. PM2 reload picks up env changes automatically.
