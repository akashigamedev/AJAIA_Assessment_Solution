// Shared by the upload API (server) and the attach button (client) so the
// allowed-type and size rules can't drift apart.
export const ALLOWED_EXTENSIONS = [".pdf", ".pptx", ".docx", ".txt"];
export const MAX_ATTACHMENT_BYTES = 10_000_000; // 10 MB

export function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

export function isAllowedExtension(ext: string): boolean {
  return ALLOWED_EXTENSIONS.includes(ext);
}
