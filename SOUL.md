# soul.md — Who You're Working With

## About Me

I'm a solo/small-team developer based in Melbourne, Australia, building **Diesel-X** — a fleet maintenance management app for the heavy equipment industry. I'm practical, not precious. I care about shipping working software, not architecture astronautics.

I lean heavily on AI coding tools to move fast. If you're reading this, you're one of them.

## How I Work

- **I plan before I build.** I invest time in PRDs, schemas, and documentation before writing code. If the docs are wrong, fix the docs first.
- **I think iteratively.** I'll start with something rough and refine it. Don't over-engineer on the first pass — get it working, then make it good.
- **I like simple infrastructure.** I host on a Digital Ocean Droplet with Nginx and PM2, not a maze of managed services. If it can be one thing instead of three, make it one thing.
- **I chose Supabase for a reason** — auth, storage, realtime, and Postgres in one place. Use the Supabase ecosystem before reaching for third-party alternatives.

## My Coding Preferences

- **TypeScript everywhere.** Strict mode. No `any` unless there's genuinely no other option, and if you use it, leave a comment explaining why.
- **Readable over clever.** I'd rather see a clear 10-line function than a dense 3-line one. Name things well. If a variable name doesn't explain itself, it's wrong.
- **Small files, small functions.** Break things up. A 500-line component is a sign something needs extracting.
- **Server-first.** Use Server Components and Server Actions by default. Only go client-side when you actually need interactivity.
- **SQL-like queries.** I use Drizzle ORM specifically because it reads like SQL. Write queries that a backend dev would recognize — don't abstract them into unreadable chains.
- **Tailwind only.** No CSS modules, no styled-components, no inline styles. Keep it in the className.
- **shadcn/ui as the base.** Don't install other component libraries. Customize the shadcn primitives if needed.

## Communication Style

- **Be direct.** Don't pad responses with disclaimers or caveats. If something's wrong, say so.
- **Explain the why, not just the what.** If you make a decision or suggest a change, tell me why in a sentence or two.
- **Flag risks early.** If a change might break something, affect multi-tenancy, or cause a security issue, call it out before writing the code.
- **Don't ask permission for obvious things.** If a function needs error handling, add it. If a type is missing, create it. Use your judgment.
- **Do ask before big changes.** If you're about to restructure a file, change the schema, or modify shared utilities, check with me first.

## Project-Specific Rules

These are non-negotiable. Read `CLAUDE.md` for the full list, but the critical ones are:

- **Every query must be scoped by organization ID.** This is a multi-tenant app. A missing org filter is a data leak.
- **The QR portal (`/qr/*`) is public.** Never add auth to these routes.
- **Task status transitions must be validated server-side.** Don't trust the client.
- **Media uploads go to Supabase Storage** with presigned URLs. Don't handle file bytes in the API layer.
- **Background jobs go through Inngest.** Never send emails, SMS, or generate PDFs inline in a request handler.
- **The deploy target is a single Droplet** running PM2 in cluster mode. No in-memory state across requests — everything shared lives in the database.

## What I Value

- **Working software over perfect code.** Ship it, then improve it.
- **Consistency over novelty.** Follow the patterns already in the codebase. Don't introduce a new way of doing something unless the old way is genuinely broken.
- **Documentation that stays current.** If you change behavior, update the relevant docs (PRD, CLAUDE.md, schema descriptions). Stale docs are worse than no docs.
- **Honest trade-offs.** If there's a shortcut that works now but will cause pain later, tell me and let me decide.

## Tech Stack Quick Reference

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL (Supabase) |
| ORM | Drizzle |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| UI | shadcn/ui + Tailwind |
| Email | Resend + React Email |
| SMS | Twilio |
| PDFs | @react-pdf/renderer |
| Background Jobs | Inngest |
| Hosting | Digital Ocean + Nginx + PM2 |
