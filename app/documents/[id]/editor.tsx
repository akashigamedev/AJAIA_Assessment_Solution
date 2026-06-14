"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useEditor,
  useEditorState,
  EditorContent,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
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
      // Send as a JSON string: passing the raw object through the server-action
      // boundary serializes it as a client reference, which Prisma rejects.
      await saveDocument(documentId, JSON.stringify(content));
      setSaveState("saved");
    },
    [documentId],
  );

  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
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

  // Clicking the blank part of the page (not on existing text) drops the cursor
  // at the end of the document so the user can keep writing.
  const focusEnd = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && editor) {
      editor.chain().focus("end").run();
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 dark:bg-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex w-full max-w-[850px] items-center justify-between px-4 py-2">
          <Link
            href="/documents"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← All documents
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">{saveLabel(saveState)}</span>
            {editable && (
              <button
                onClick={saveNow}
                disabled={saveState !== "unsaved"}
                className="rounded-md border border-zinc-200 px-3 py-1 text-sm hover:border-zinc-400 disabled:opacity-40 dark:border-zinc-700"
              >
                Save
              </button>
            )}
          </div>
        </div>
        {editable && <Toolbar editor={editor} />}
      </header>

      <div className="flex justify-center px-4 py-8">
        <div
          onMouseDown={focusEnd}
          className="w-full max-w-[794px] cursor-text rounded-sm bg-white px-[72px] py-[64px] text-zinc-900 shadow-sm"
          style={{ minHeight: "1000px" }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            disabled={!editable}
            className="mb-2 w-full bg-transparent text-3xl font-bold outline-none placeholder:text-zinc-300"
            placeholder="Untitled document"
          />
          <EditorContent editor={editor} className="editor-content" />
        </div>
      </div>
    </div>
  );
}

function saveLabel(state: SaveState) {
  if (state === "saving") return "Saving…";
  if (state === "unsaved") return "Unsaved changes";
  return "Saved";
}

function Toolbar({ editor }: { editor: Editor | null }) {
  // Subscribes to the editor's selection so active-state highlights stay in
  // sync as the cursor moves, not just when the document changes.
  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            h1: editor.isActive("heading", { level: 1 }),
            h2: editor.isActive("heading", { level: 2 }),
            bullet: editor.isActive("bulletList"),
            ordered: editor.isActive("orderedList"),
          }
        : null,
  });

  if (!editor || !active) return null;

  return (
    <div className="mx-auto flex w-full max-w-[850px] flex-wrap gap-1 px-4 pb-2">
      <Btn active={active.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn active={active.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="italic">I</span>
      </Btn>
      <Btn active={active.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Btn>
      <Divider />
      <Btn active={active.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn active={active.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Divider />
      <Btn active={active.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </Btn>
      <Btn active={active.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
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
  return <span className="mx-1 w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />;
}
