"use client";

import { useState } from "react";
import { Share2, X, Copy, Check } from "lucide-react";
import { getShareInfo, unshareDocument } from "../actions";

type ShareInfo = Awaited<ReturnType<typeof getShareInfo>>;

export default function ShareButton({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl =
    info && typeof window !== "undefined"
      ? `${window.location.origin}/share/${info.token}`
      : "";

  async function load() {
    setInfo(await getShareInfo(documentId));
  }

  function openDialog() {
    setInfo(null);
    setCopied(false);
    setOpen(true);
    load();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function remove(userId: string) {
    setBusy(true);
    await unshareDocument(documentId, userId);
    await load();
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 dark:border-zinc-700"
      >
        <Share2 className="h-4 w-4" />
        Share
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Share document</h2>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!info ? (
              <p className="mt-4 text-sm text-zinc-500">Loading…</p>
            ) : (
              <>
                <p className="mt-3 text-sm text-zinc-500">
                  Anyone with this link can sign in and edit this document.
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" /> Copy
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    People with access
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {info.shares.length === 0 && (
                      <li className="text-sm text-zinc-500">
                        Not shared with anyone yet.
                      </li>
                    )}
                    {info.shares.map((s) => (
                      <li
                        key={s.userId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium">
                            {s.name}
                          </span>
                          <span className="truncate text-xs text-zinc-500">
                            {s.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {s.role === "VIEWER" ? "Viewer" : "Editor"}
                          </span>
                          <button
                            onClick={() => remove(s.userId)}
                            disabled={busy}
                            aria-label={`Remove ${s.name}`}
                            className="rounded p-1 text-zinc-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
