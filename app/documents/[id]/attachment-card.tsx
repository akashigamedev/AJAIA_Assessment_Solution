"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { X } from "lucide-react";

const EXT_COLORS: Record<string, string> = {
  ".pdf": "bg-red-600",
  ".docx": "bg-blue-600",
  ".pptx": "bg-orange-500",
  ".txt": "bg-zinc-500",
};

export default function AttachmentCard({ node, deleteNode, editor }: NodeViewProps) {
  const { fileId, name, ext, size } = node.attrs as {
    fileId: string | null;
    name: string;
    ext: string;
    size: number;
  };
  const uploading = !fileId;
  const color = EXT_COLORS[ext] ?? "bg-zinc-500";

  return (
    <NodeViewWrapper className="my-2" contentEditable={false}>
      <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
        {uploading ? (
          <>
            <div className="h-10 w-10 shrink-0 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-4 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          </>
        ) : (
          <>
            <a
              href={`/api/attachments/${fileId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded text-[10px] font-bold uppercase text-white ${color}`}
              >
                {ext.replace(".", "")}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{name}</span>
                <span className="text-xs text-zinc-500">{formatSize(size)}</span>
              </span>
            </a>
            {editor.isEditable && (
              <button
                type="button"
                onClick={() => deleteNode()}
                title="Remove attachment"
                aria-label="Remove attachment"
                className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
