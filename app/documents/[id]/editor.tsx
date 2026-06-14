"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor-extensions";
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
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [editingTitle, setEditingTitle] = useState(false);
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
    extensions: editorExtensions,
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

  const goBack = async () => {
    if (editor && editable && saveState !== "saved") {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      await save(editor.getJSON());
    }
    router.push("/documents");
  };

  const commitTitle = () => {
    setEditingTitle(false);
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
    <div className="flex min-h-screen flex-col bg-zinc-200 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-[850px] items-center justify-between gap-3 px-4 py-2">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={goBack}
              className="shrink-0 text-sm text-zinc-500 hover:underline"
            >
              ← All documents
            </button>
            {editingTitle ? (
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="min-w-0 rounded-md border border-zinc-400 px-2 py-1 text-sm font-medium outline-none dark:border-zinc-500 dark:bg-zinc-800"
              />
            ) : (
              <button
                onClick={() => editable && setEditingTitle(true)}
                title={editable ? "Click to rename" : undefined}
                className="min-w-0 truncate rounded-md px-2 py-1 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {title}
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-3">
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
          className="w-full max-w-[794px] cursor-text rounded-sm bg-white px-[72px] py-[64px] text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100"
          style={{ minHeight: "1000px" }}
        >
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
  // Re-render on every editor transaction (edits and cursor moves) so the
  // active-state highlights stay in sync with where the cursor is.
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", force);
    return () => {
      editor.off("transaction", force);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="mx-auto flex w-full max-w-[850px] flex-wrap gap-1 px-4 pb-2">
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
      <Btn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <Btn active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        H4
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
  return <span className="mx-1 w-px self-stretch bg-zinc-200 dark:bg-zinc-700" />;
}
