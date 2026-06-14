import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDocumentForUser } from "@/lib/access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return new Response("Not found", { status: 404 });

  // Only users with access to the parent document may download.
  const access = await getDocumentForUser(attachment.documentId, user.id);
  if (!access) return new Response("Forbidden", { status: 403 });

  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
    },
  });
}
