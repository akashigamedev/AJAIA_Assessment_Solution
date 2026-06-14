# Submission

**Project:** Ajaia Docs — a lightweight collaborative document editor
**Live URL:** https://ajaia-assessment-solution.vercel.app
**Walkthrough video:** see `VIDEO.md`

## What's included

- **Source code** — Next.js 16 app (App Router, TypeScript, Tailwind 4, Tiptap, Prisma + PostgreSQL).
- **README.md** — setup/run instructions, seeded accounts, supported file types.
- **ARCHITECTURE.md** — what was prioritized and why, plus key decisions and tradeoffs.
- **AI_WORKFLOW.md** — which AI tools were used, where they helped, what was changed/rejected, and how correctness was verified.
- **SUBMISSION.md** — this file.
- **VIDEO.md** — link to the walkthrough video.

## What's working

Mapped to the assignment's core requirements:

| Requirement | Status | Notes |
| ----------- | ------ | ----- |
| Create / rename / edit / reopen documents | ✅ | Title is editable in the header; documents reopen with content intact. |
| Rich-text formatting | ✅ | Bold, italic, underline, headings H1–H4, bulleted & numbered lists. |
| File upload into the workflow | ✅ | Upload `.txt`/`.md` → new document. Markdown formatting parsed; plain-text layout preserved. |
| File attachments | ✅ | Attach `.pdf/.pptx/.docx/.txt` to a line, shown as a card; stored in the database; served via an API route with access checks. |
| Sharing (owner + grant access) | ✅ | Owner generates a share link; opening it grants edit access. Owner can see collaborators and revoke. |
| Owned vs. shared distinction | ✅ | Separate "My documents" and "Shared with me" sections. |
| Persistence | ✅ | Documents, attachments, and shares persist in PostgreSQL; survive refresh; formatting preserved (stored as Tiptap JSON). |
| Validation & error handling | ✅ | File type/size checks (client + server), access checks on every document/attachment/share action, friendly UI errors. |
| Automated test | ✅ | At least one meaningful test covering the sharing access-control logic. |
| Deployment | ✅ | Live on Vercel with a hosted PostgreSQL database (Supabase). |
| Light/Dark/System theme | ✅ | Floating switcher; preference persists with no flash. |

## What's intentionally not included

These were deliberate scope cuts to keep depth in the core features within the timebox:

- **Real authentication.** Auth is mocked with seeded users (pick-a-user, no passwords). This was a stated allowance and keeps the sharing flow easy to demo. Note: the session cookie is not cryptographically signed, so it isn't production-grade.
- **Real-time collaboration.** Editing is single-writer with autosave (last write wins). There are no live cursors or operational-transform/CRDT conflict resolution.
- **Comments, suggestions, and version history.** (Listed as optional stretch goals.)
- **Export** to PDF/DOCX/Markdown.
- **Granular roles beyond the link.** The link grants Editor access; there's no per-user role picker or Viewer-only links (the access model supports Viewer/Editor in the schema, but the UI uses a single Editor link).
- **Attachment storage at scale.** Files are stored as bytes in PostgreSQL, which is simple and self-contained but not ideal for large files at scale (a blob store would be better). Removing an attachment removes it from the document but leaves the bytes until the document is deleted (cascade), to keep undo safe.

## What I'd build next with another 2–4 hours

1. **Move attachments to object storage** (e.g. Supabase Storage / S3 / Vercel Blob) instead of storing file bytes in PostgreSQL — better for large files, keeps the database lean, and serves files via CDN.
2. **A Notion-style "/" command system** per line for quickly inserting headings, lists, tables, and files using simple slash commands.
3. **Organizations and members** — create an organization, attach members, and share documents by picking a member directly from the share menu.
4. **Collections** — organize documents into collections/folders.
5. **Export** documents to different formats (PDF, DOCX, TXT).
6. **Public read-only links** — share a URL that anyone can open to view a document without signing in.
