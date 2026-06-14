# Architecture Notes

A short tour of how Ajaia Docs is built and the decisions behind it.

## What I prioritized

The prompt rewards **depth in a few areas over shallow coverage everywhere**, so I spent the time on the parts a real product lives or dies by:

1. **A genuinely usable editor** — formatting that actually renders, autosave you can trust (with a visible status), and a paper-like writing surface.
2. **Persistence that preserves structure** — content stored as structured JSON, not flattened text, so formatting round-trips exactly.
3. **A sharing model that demonstrably works** — owner, link-based grant, owned-vs-shared distinction, and revoke.

Everything else (auth, theming polish, icons) was kept deliberately light so it didn't eat into those three.

## Stack

- **Next.js 16 (App Router) + React 19 + TypeScript** — server components for data loading, client components only where there's interactivity (the editor, dialogs, theme switcher).
- **Tiptap 3** for rich text. Its document model is structured JSON, which is exactly what good persistence needs.
- **Prisma 7 → PostgreSQL (Supabase)** — typed data access; Postgres because the data is relational (users, documents, shares, attachments).
- **Tailwind 4** for styling.
- **Vercel** for hosting; the database is hosted on Supabase.

## Data model

Four tables (`prisma/schema.prisma`):

- **User** — id, email, name. Seeded; no passwords.
- **Document** — title, `content` (Tiptap JSON), `ownerId`, `shareToken`.
- **Share** — links a document to a user with a role (`VIEWER` / `EDITOR`). Unique per (document, user).
- **Attachment** — file bytes + metadata, tied to a document (cascade-deletes with it).

`Document.content` is `Json` so a document's full structure — headings, marks, lists, attachment nodes — is stored verbatim and restored on load.

## Key decisions and tradeoffs

**Tiptap JSON as the source of truth.** Storing the editor's JSON (rather than HTML or Markdown) means formatting can't drift between save and reload, and the same schema is reused when importing files (`lib/editor-extensions.ts` is shared by the editor and the import parser, so imported content is parsed exactly the way the editor renders it).

**Server Actions over a REST layer.** Document create/rename/save/delete and all sharing operations are server actions — less boilerplate, colocated with the UI, and type-safe end to end. The one exception is **attachments**, which use route handlers (`/api/attachments`): uploads are multipart and downloads need to stream bytes with the right content type, which routes handle naturally. (One gotcha I hit and fixed: the editor's JSON has to cross the server-action boundary as a string — passing the raw object made React serialize it as a client reference that Prisma rejected.)

**Lightweight auth, on purpose.** The prompt allows mocked auth. Users are seeded and you "log in" by picking one; the session is just the user id in an httpOnly cookie, resolved against the DB on each request. This keeps the sharing story easy to demonstrate. The tradeoff: the cookie isn't signed, so it isn't production-grade — a real build would add proper auth.

**One access helper for authorization.** `lib/access.ts#getDocumentForUser` resolves a user's role for a document (owner / editor / viewer / none) in one place, and is used by both the editor page (to load and gate) and every write action (to authorize). Centralizing it means access rules can't drift between read and write paths.

**Link-based sharing.** The owner generates an unguessable `shareToken`; visiting `/share/[token]` (while signed in) grants the visitor edit access and opens the document. This matches the "anyone with the link" mental model and works cleanly with seeded accounts. The owner can see who joined and revoke.

**Attachments stored in Postgres.** Files are stored as bytes in the database and served through an access-checked API route. This is fully self-contained — no extra service, no credentials, and it works identically locally and on Vercel (whose filesystem is ephemeral, so writing to local disk would break in production). The tradeoff is that it doesn't scale to large files; moving to object storage is the first item on the "next steps" list.

**Autosave with a visible, honest status.** Edits debounce-save ~1s after you stop typing; the status shows Saving…/Saved and fades once settled. Navigating "back" flushes a final save first so the last keystrokes aren't lost. There's no manual Save button because autosave plus a clear indicator is both simpler and more trustworthy.

**Class-based theming.** The theme switcher resolves System/Light/Dark to a `.dark` class on `<html>`, applied by a tiny inline script before paint to avoid a flash. The preference is read via `useSyncExternalStore` so it stays consistent across SSR and hydration.

## Request flow, briefly

- **Load a document:** `app/documents/[id]/page.tsx` (server) authorizes via `getDocumentForUser`, then passes the stored JSON to the client `Editor`.
- **Edit:** the client editor debounces and calls the `saveDocument` server action, which re-checks access and writes the JSON.
- **Share:** owner opens the dialog → `getShareInfo` ensures a token and lists collaborators → the link points at `/share/[token]`, which upserts a `Share` and redirects into the document.

## Testing

The automated test (`lib/access.test.ts`, run with `yarn test`) targets the
`getDocumentForUser` / `canEdit` authorization logic — the security-critical
branching that the whole sharing model rests on. The database is mocked so the
test is fast and deterministic. This was chosen as the most meaningful single
test: a bug here would mean the wrong people could read or edit a document.

## Where things live

```
app/
  documents/
    page.tsx              # document list (owned + shared)
    actions.ts            # server actions: docs + sharing
    upload-button.tsx     # .txt/.md import
    [id]/
      page.tsx            # auth + load
      editor.tsx          # Tiptap editor, toolbar, autosave
      attachment-*.tsx    # attachment node + card
      share-button.tsx    # share dialog
  share/[token]/page.tsx  # link redemption
  api/attachments/        # upload + download routes
  components/             # avatar, theme switcher
lib/
  db.ts                   # Prisma client
  session.ts              # cookie session
  access.ts               # authorization helper
  editor-extensions.ts    # shared Tiptap schema
  attachments.ts          # allowed types / size limits
prisma/schema.prisma      # data model
```
