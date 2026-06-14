import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getDocumentForUser, canEdit } from "@/lib/access";
import Editor from "./editor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const access = await getDocumentForUser(id, user.id);
  if (!access) notFound();

  return (
    <Editor
      documentId={id}
      initialTitle={access.document.title}
      initialContent={access.document.content}
      editable={canEdit(access.role)}
      isOwner={access.role === "OWNER"}
      userName={user.name}
    />
  );
}
