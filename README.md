# Ajaia Docs

A lightweight collaborative document editor — think a small slice of Google Docs. Create and edit rich-text documents, import `.txt`/`.md` files, attach files to a document, and share documents with other users via a link.

**Live demo:** https://ajaia-assessment-solution.vercel.app
**Walkthrough video:** https://youtu.be/0tQKsFicMhM
**Source:** https://github.com/akashigamedev/AJAIA_Assessment_Solution

## Features

- **Rich-text editing** — bold, italic, underline, headings (H1–H4), and bulleted/numbered lists, on a paper-like page.
- **Autosave** — changes save automatically a moment after you stop typing; a status indicator shows "Saving…/Saved".
- **Import a file** — upload a `.txt` or `.md` file to turn it into a new document. Markdown headings, lists, bold/italic, and `<u>` underline are parsed; plain-text layout (including blank lines) is preserved.
- **Attachments** — attach a `.pdf`, `.pptx`, `.docx`, or `.txt` file to a line. Files are stored in the database and shown as a card with a remove button.
- **Sharing** — the owner generates a share link; anyone who opens it (signed in) gets edit access. Documents are split into **My documents** and **Shared with me**, and the owner can see collaborators and revoke access.
- **Light/Dark/System theme** — a floating switcher, bottom-right.

## Accounts (seeded)

Auth is intentionally lightweight for this exercise: there are no passwords. On the login screen you pick which seeded user to sign in as. This keeps the sharing flow easy to demonstrate.

| Name  | Email             |
| ----- | ----------------- |
| Alice | alice@ajaia.test  |
| Bob   | bob@ajaia.test    |
| Carol | carol@ajaia.test  |

To demo sharing: sign in as Alice, create a document, click **Share**, copy the link, sign out, sign in as Bob, and open the link — the document now appears under Bob's "Shared with me".

## Supported file types

- **Import to new document:** `.txt`, `.md`
- **Attachments:** `.pdf`, `.pptx`, `.docx`, `.txt` (max 10 MB each)

Unsupported types are rejected with a message in the UI.

## Tech stack

- **Next.js 16** (App Router) + **React 19**, **TypeScript**, **Tailwind CSS 4**
- **Tiptap 3** editor — document content is stored as Tiptap JSON
- **Prisma 7** → **PostgreSQL** (hosted on Supabase)
- Deployed on **Vercel**

## Running locally

Requirements: Node 20+ and [Yarn](https://yarnpkg.com) (the project uses Yarn; npm works too).

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Set environment variables** — create a `.env` file in the project root:

   ```bash
   # Pooled connection used by the app at runtime
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true"
   # Direct connection used for migrations
   DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
   ```

   Any PostgreSQL database works. With Supabase, copy the pooled and direct connection strings from the project's database settings. Secrets are never committed — `.env*` is git-ignored.

3. **Set up the database** (creates tables and seeds the three users)

   ```bash
   yarn prisma migrate deploy
   yarn db:seed
   ```

4. **Run the dev server**

   ```bash
   yarn dev
   ```

   Open http://localhost:3000.

## Useful commands

| Command | What it does |
| ------- | ------------ |
| `yarn dev` | Start the dev server |
| `yarn build` | Production build (runs `prisma generate` first) |
| `yarn db:seed` | Seed the three demo users |
| `yarn prisma migrate deploy` | Apply database migrations |
| `yarn lint` | Run ESLint |
| `yarn test` | Run the test suite (Vitest) |

## Testing

Run `yarn test`. The suite (`lib/access.test.ts`) covers the document
authorization logic that the sharing model relies on — owner, editor, viewer,
and no-access cases. The database is mocked, so the tests run in under a second
with no network or database needed.

## Deployment notes

- The Vercel build command is `prisma generate && next build` (already set in `package.json`), because the generated Prisma client is git-ignored.
- Set `DATABASE_URL` and `DIRECT_URL` in the Vercel project's environment variables.
