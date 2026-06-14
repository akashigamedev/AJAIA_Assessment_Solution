"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDocumentForUser, canEdit } from "@/lib/access";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Only the owner may manage who a document is shared with.
async function requireOwner(documentId: string, userId: string) {
  const access = await getDocumentForUser(documentId, userId);
  if (!access || access.role !== "OWNER") {
    throw new Error("Only the owner can manage sharing");
  }
}

export async function createDocument() {
  const user = await requireUser();
  const doc = await prisma.document.create({ data: { ownerId: user.id } });
  redirect(`/documents/${doc.id}`);
}

export async function createFromUpload(title: string, contentJson: string) {
  const user = await requireUser();
  const content = JSON.parse(contentJson) as Prisma.InputJsonValue;
  const doc = await prisma.document.create({
    data: {
      ownerId: user.id,
      title: title.trim() || "Untitled document",
      content,
    },
  });
  return doc.id;
}

export async function renameDocument(id: string, title: string) {
  const user = await requireUser();
  const access = await getDocumentForUser(id, user.id);
  if (!access || !canEdit(access.role)) throw new Error("Not allowed");

  await prisma.document.update({
    where: { id },
    data: { title: title.trim() || "Untitled document" },
  });
  revalidatePath("/documents");
}

export async function saveDocument(id: string, contentJson: string) {
  const user = await requireUser();
  const access = await getDocumentForUser(id, user.id);
  if (!access || !canEdit(access.role)) throw new Error("Not allowed");

  const content = JSON.parse(contentJson) as Prisma.InputJsonValue;
  await prisma.document.update({ where: { id }, data: { content } });
}

// Returns the document's share link token (creating one on first use) plus the
// list of people who have joined via the link. Owner-only.
export async function getShareInfo(documentId: string) {
  const user = await requireUser();
  await requireOwner(documentId, user.id);

  let doc = await prisma.document.findUniqueOrThrow({
    where: { id: documentId },
    select: { shareToken: true },
  });
  if (!doc.shareToken) {
    doc = await prisma.document.update({
      where: { id: documentId },
      data: { shareToken: crypto.randomUUID() },
      select: { shareToken: true },
    });
  }

  const shares = await prisma.share.findMany({
    where: { documentId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return {
    token: doc.shareToken,
    shares: shares.map((s) => ({
      userId: s.userId,
      name: s.user.name,
      email: s.user.email,
      role: s.role,
    })),
  };
}

export async function unshareDocument(documentId: string, userId: string) {
  const user = await requireUser();
  await requireOwner(documentId, user.id);
  await prisma.share.deleteMany({ where: { documentId, userId } });
}

export async function deleteDocument(id: string) {
  const user = await requireUser();
  const access = await getDocumentForUser(id, user.id);
  if (!access || access.role !== "OWNER") {
    throw new Error("Only the owner can delete a document");
  }

  await prisma.document.delete({ where: { id } });
  revalidatePath("/documents");
}
