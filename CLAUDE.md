# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Ajaia Docs — a lightweight collaborative document editor (Google Docs-lite) built as a take-home assignment. Core scope: rich-text doc editing, file upload into the doc workflow, and sharing docs between users. Depth in a few areas over shallow coverage everywhere.

## Commands

Package manager is **yarn** (Node 26).

- `yarn dev` — run the dev server
- `yarn build` — production build (also runs `tsc`; treat type/build errors as blocking)
- `yarn lint` — ESLint
- `yarn prisma migrate dev --name <name>` — create + apply a migration locally
- `yarn prisma generate` — regenerate the Prisma client into `app/generated/prisma` (gitignored, so required after schema changes and in CI/deploy builds)

## Stack & key decisions

- **Next.js 16 (App Router) + React 19 + Tailwind 4**.
- **Tiptap** (`@tiptap/react` + `starter-kit` + `underline`) is the editor. Document content is stored as Tiptap JSON, not HTML.
- **Prisma 7 → Supabase Postgres**. Connection comes from `DATABASE_URL` (pooled, pgbouncer) and `DIRECT_URL` (direct, for migrations) in `.env` — both are required and must never be hardcoded. The generated client lives at `app/generated/prisma` (import from there, not `@prisma/client`).
- Auth is intentionally lightweight: seeded users + a simple cookie session, chosen to keep the sharing flow demoable without spending the timebox on a full auth system.

## Deploy notes

- Target is Vercel; the database already lives on Supabase.
- Because `app/generated/prisma` is gitignored, the Vercel build command must run `prisma generate` before `next build`.
- Set `DATABASE_URL` and `DIRECT_URL` as Vercel env vars.

## Conventions

- Only abstract when two or more modules need the same thing; prefer simple inline code first.
- Comment only genuinely tricky or critical logic; skip the obvious.
