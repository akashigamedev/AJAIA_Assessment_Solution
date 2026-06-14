"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Paperclip,
} from "lucide-react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { editorExtensions } from "@/lib/editor-extensions";
import { Attachment } from "./attachment-extension";
import ShareButton from "./share-button";
import {
  extensionOf,
  isAllowedExtension,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments";
import { saveDocument, renameDocument } from "../actions";

type SaveState = "saved" | "saving" | "unsaved";

const AUTOSAVE_DELAY = 1000;

export default function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  editable,
  isOwner,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: unknown;
  editable: boolean;
  isOwner: boolean;
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
    extensions: [...editorExtensions, Attachment],
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
              className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              All documents
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
            {isOwner && <ShareButton documentId={documentId} />}
          </div>
        </div>
        {editable && <Toolbar editor={editor} documentId={documentId} />}
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

function Toolbar({
  editor,
  documentId,
}: {
  editor: Editor | null;
  documentId: string;
}) {
  // Re-render on every editor transaction (edits and cursor moves) so the
  // active-state highlights stay in sync with where the cursor is.
  const [, force] = useReducer((n: number) => n + 1, 0);
  const fileInput = useRef<HTMLInputElement>(null);
  const [attachError, setAttachError] = useState<string | null>(null);

  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", force);
    return () => {
      editor.off("transaction", force);
    };
  }, [editor]);

  async function onAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    const ext = extensionOf(file.name);
    if (!isAllowedExtension(ext)) {
      setAttachError("Only PDF, PPTX, DOCX, or TXT files are allowed.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachError("File is too large (max 10 MB).");
      return;
    }
    setAttachError(null);

    // Insert a placeholder card that shows its skeleton while uploading.
    const clientId = crypto.randomUUID();
    editor
      .chain()
      .focus()
      .insertContent({
        type: "attachment",
        attrs: { clientId, fileId: null, name: file.name, ext, size: file.size },
      })
      .run();

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("documentId", documentId);
      const res = await fetch("/api/attachments", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const meta = (await res.json()) as { id: string };
      setAttachmentFileId(editor, clientId, meta.id);
    } catch {
      removeAttachment(editor, clientId);
      setAttachError("Upload failed. Please try again.");
    }
  }

  if (!editor) return null;

  return (
    <div className="mx-auto flex w-full max-w-[850px] flex-wrap gap-1 px-4 pb-2">
      <Btn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="h-4 w-4" />
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
      <Btn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Btn>
      <Btn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Btn>
      <Divider />
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.pptx,.docx,.txt"
        onChange={onAttach}
        className="hidden"
      />
      <Btn label="Attach file (PDF, PPTX, DOCX, TXT)" active={false} onClick={() => fileInput.current?.click()}>
        <Paperclip className="h-4 w-4" />
      </Btn>
      {attachError && (
        <span className="ml-2 self-center text-xs text-red-600">{attachError}</span>
      )}
    </div>
  );
}

// Locate the attachment node carrying this clientId so an async upload can
// update or remove it after it resolves.
function findAttachmentPos(editor: Editor, clientId: string): number | null {
  let found: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "attachment" && node.attrs.clientId === clientId) {
      found = pos;
      return false;
    }
  });
  return found;
}

function setAttachmentFileId(editor: Editor, clientId: string, fileId: string) {
  const pos = findAttachmentPos(editor, clientId);
  if (pos === null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  editor
    .chain()
    .command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, { ...node.attrs, fileId, clientId: null });
      return true;
    })
    .run();
}

function removeAttachment(editor: Editor, clientId: string) {
  const pos = findAttachmentPos(editor, clientId);
  if (pos === null) return;
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return;
  editor
    .chain()
    .command(({ tr }) => {
      tr.delete(pos, pos + node.nodeSize);
      return true;
    })
    .run();
}

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
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
