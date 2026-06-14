"use client";

import { useRef, useState } from "react";
import { marked } from "marked";
import { generateJSON } from "@tiptap/core";
import { editorExtensions } from "@/lib/editor-extensions";
import { createFromUpload } from "./actions";

const MAX_BYTES = 1_000_000; // 1 MB

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Plain text: each line is its own paragraph; blank lines stay blank.
function textToHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

export default function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-uploading the same file
    if (!file) return;

    setError(null);
    const name = file.name;
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".txt" && ext !== ".md") {
      setError("Only .txt and .md files are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large (max 1 MB).");
      return;
    }

    setBusy(true);
    try {
      const text = await file.text();
      const html =
        ext === ".md" ? (marked.parse(text, { async: false }) as string) : textToHtml(text);
      const json = generateJSON(html, editorExtensions);
      const title = name.slice(0, name.length - ext.length);
      await createFromUpload(title, JSON.stringify(json));
    } catch {
      setError("Could not read that file. Please try another.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md"
        onChange={onFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:border-zinc-400 disabled:opacity-50 dark:border-zinc-700"
      >
        {busy ? "Importing…" : "Upload .txt / .md"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
