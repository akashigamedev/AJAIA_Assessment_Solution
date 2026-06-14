import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

// Visiting a share link grants the signed-in user edit access (unless they are
// the owner) and drops them into the document.
export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const doc = await prisma.document.findUnique({
    where: { shareToken: token },
    select: { id: true, ownerId: true },
  });
  if (!doc) notFound();

  if (doc.ownerId !== user.id) {
    await prisma.share.upsert({
      where: { documentId_userId: { documentId: doc.id, userId: user.id } },
      update: {},
      create: { documentId: doc.id, userId: user.id, role: "EDITOR" },
    });
  }

  redirect(`/documents/${doc.id}`);
}
