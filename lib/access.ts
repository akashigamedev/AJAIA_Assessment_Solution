import { prisma } from "@/lib/db";

// Resolves what a user is allowed to do with a document. Returns null when the
// user has no access at all. Used by the editor page (to load) and the document
// actions (to authorize writes), so it lives here rather than being duplicated.
export async function getDocumentForUser(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { shares: { where: { userId } } },
  });
  if (!document) return null;

  if (document.ownerId === userId) {
    return { document, role: "OWNER" as const };
  }

  const share = document.shares[0];
  if (share) {
    return { document, role: share.role };
  }

  return null;
}

export function canEdit(role: "OWNER" | "EDITOR" | "VIEWER") {
  return role === "OWNER" || role === "EDITOR";
}
