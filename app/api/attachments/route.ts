import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDocumentForUser, canEdit } from "@/lib/access";
import {
  extensionOf,
  isAllowedExtension,
  MAX_ATTACHMENT_BYTES,
} from "@/lib/attachments";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const documentId = String(form.get("documentId") ?? "");
  if (!(file instanceof File)) {
    return new Response("No file", { status: 400 });
  }

  const access = await getDocumentForUser(documentId, user.id);
  if (!access || !canEdit(access.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ext = extensionOf(file.name);
  if (!isAllowedExtension(ext)) {
    return new Response("Unsupported file type", { status: 415 });
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return new Response("File too large", { status: 413 });
  }

  const data = Buffer.from(await file.arrayBuffer());
  const attachment = await prisma.attachment.create({
    data: {
      documentId,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      data,
    },
    select: { id: true, filename: true, size: true },
  });

  return Response.json({
    id: attachment.id,
    name: attachment.filename,
    ext,
    size: attachment.size,
  });
}
