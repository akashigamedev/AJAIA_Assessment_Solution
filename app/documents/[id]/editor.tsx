"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { saveDocument, renameDocument } from "../actions";

type SaveState = "saved" | "saving" | "unsaved";

const AUTOSAVE_DELAY = 1000;

export default function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  editable,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: unknown;
  editable: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (content: object) => {
      setSaveState("saving");
      await saveDocument(documentId, content);
      setSaveState("saved");
    },
    [documentId],
  );

  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [StarterKit, Underline],
    content: (initialContent as object) ?? "",
    onUpdate: ({ editor }) => {
      setSaveState("unsaved");
      const json = editor.getJSON();
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => save(json), AUTOSAVE_DELAY);
    },
  });

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const saveNow = () => {
    if (!editor) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    save(editor.getJSON());
  };

  const commitTitle = () => {
    if (!editable) return;
    const next = title.trim() || "Untitled document";
    setTitle(next);
    if (next !== initialTitle) renameDocument(documentId, next);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/documents" className="text-sm text-zinc-500 hover:underline">
          ← All documents
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{saveLabel(saveState)}</span>
          {editable && (
            <button
              onClick={saveNow}
              disabled={saveState !== "unsaved"}
              className="rounded-md border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 disabled:opacity-40 dark:border-zinc-800"
            >
              Save
            </button>
          )}
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        disabled={!editable}
        className="mt-6 w-full bg-transparent text-3xl font-semibold tracking-tight outline-none"
        placeholder="Untitled document"
      />

      {editable && <Toolbar editor={editor} />}

      <EditorContent
        editor={editor}
        className="editor-content mt-4 min-h-[60vh] rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      />

      {!editable && (
        <p className="mt-3 text-sm text-zinc-500">
          You have view-only access to this document.
        </p>
      )}
    </main>
  );
}

function saveLabel(state: SaveState) {
  if (state === "saving") return "Saving…";
  if (state === "unsaved") return "Unsaved changes";
  return "Saved";
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Btn>
      <Divider />
      <Btn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Divider />
      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-9 rounded px-2 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
        active ? "bg-zinc-200 dark:bg-zinc-700" : ""
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 w-px self-stretch bg-zinc-200 dark:bg-zinc-800" />;
}
