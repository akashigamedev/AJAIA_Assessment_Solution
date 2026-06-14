# AI Workflow Note

## Tools used

- **Claude Code** (Anthropic's CLI agent) as the primary pair-programming tool, driven interactively. I directed each step — choosing the scope, the approach, and the tradeoffs — and the agent implemented, ran builds/lint, and helped debug.
- **GitHub Copilot–style editor assistance** for small in-file completions.

The working pattern was deliberate: I made the product and architecture decisions (often correcting the agent's first instinct), and used AI to move fast on implementation and to catch mistakes.

## Where AI materially sped up the work

- **Scaffolding the stack** — the Prisma schema, the Tiptap editor integration (toolbar, autosave, JSON persistence), server actions, and the document list/editor pages came together far faster than writing them by hand.
- **The harder features** — the per-line attachment system (a custom Tiptap node + React node view, an upload/download API, skeleton states) and the link-based sharing flow were built quickly with AI doing the boilerplate while I shaped the behavior.
- **Debugging** — AI was most valuable here. It helped pinpoint several real bugs fast (see below).
- **Documentation** — generating first drafts of the README, architecture note, and this file from the actual code and decisions.

## What I changed or rejected

- **Sharing model.** The agent's first version let the owner pick a seeded user from a dropdown. I rejected that and redirected it to a **shareable-link** model (generate a link → anyone who opens it gets access), which matches how sharing actually feels and reads better in a demo.
- **File storage.** The prompt said "store files locally on our server." The agent would have written to local disk — I flagged that this breaks on Vercel (ephemeral filesystem) and we chose to store bytes in Postgres instead, which works identically locally and in production. I also recorded "move to object storage" as the top next step.
- **Over-engineering.** I set explicit rules up front — no premature abstraction, no over-documentation, plain language — and pushed back when output drifted toward unnecessary complexity.
- **A stray `vercel.json`.** A catch-all rewrite config would have broken App Router routing on deploy; we removed it.
- **`.txt` import fidelity.** The first import turned every line into a paragraph, which doubled blank lines. We iterated until the output matched the source file's layout exactly.

## How I verified correctness, UX, and reliability

- **Build + lint on every change.** `yarn build` (which type-checks) and `yarn lint` were run after each feature; type/build errors were treated as blocking.
- **Browser verification of every feature.** Early on this was done with automated headless-browser runs (formatting renders, autosave reaches "Saved", reload preserves content, the full two-user share flow). Once the flows were stable I switched to clicking through them myself in the running app, which was faster.
- **An automated test for the security-critical logic.** `lib/access.test.ts` covers the document authorization rules (owner/editor/viewer/no-access) so a regression there is caught immediately.
- **End-to-end checks of the real flows**, not just units — e.g. uploading a real file and confirming the API serves it with the right content type, and sharing a document from one seeded user to another and confirming access (and revocation).
- **Reading the diffs.** I reviewed what the agent wrote rather than accepting it blindly, which is how the bugs above were caught and corrected.

## Honest assessment

AI made this much faster, especially on boilerplate and debugging, but the judgment calls — scope cuts, the sharing model, the storage decision, the deployment constraints — were mine. The agent's first answer was often a reasonable starting point that needed correcting, not a finished solution.
