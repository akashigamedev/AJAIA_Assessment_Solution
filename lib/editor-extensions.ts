import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

// Shared by the live editor and the file-upload parser so that imported
// content is parsed against exactly the schema the editor renders.
export const editorExtensions = [
  StarterKit,
  Placeholder.configure({ placeholder: "Start writing…" }),
];
