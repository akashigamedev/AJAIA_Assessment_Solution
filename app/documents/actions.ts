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
  redirect(`/documents/${doc.id}`);
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

export async function deleteDocument(id: string) {
  const user = await requireUser();
  const access = await getDocumentForUser(id, user.id);
  if (!access || access.role !== "OWNER") {
    throw new Error("Only the owner can delete a document");
  }

  await prisma.document.delete({ where: { id } });
  revalidatePath("/documents");
}
