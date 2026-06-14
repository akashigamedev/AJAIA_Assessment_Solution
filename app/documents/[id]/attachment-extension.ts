import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import AttachmentCard from "./attachment-card";

// A block-level atom that holds one uploaded file. While `fileId` is null the
// card renders its uploading skeleton; once set, it links to the file.
export const Attachment = Node.create({
  name: "attachment",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      // Transient client id used to locate the node after its upload finishes.
      clientId: { default: null, rendered: false },
      fileId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-file-id"),
        renderHTML: (attrs) =>
          attrs.fileId ? { "data-file-id": attrs.fileId } : {},
      },
      name: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-name"),
        renderHTML: (attrs) => ({ "data-name": attrs.name }),
      },
      ext: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-ext"),
        renderHTML: (attrs) => ({ "data-ext": attrs.ext }),
      },
      size: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-size") ?? 0),
        renderHTML: (attrs) => ({ "data-size": attrs.size }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-attachment]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-attachment": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentCard);
  },
});
