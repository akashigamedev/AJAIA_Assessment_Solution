import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, clearSession } from "@/lib/session";
import { createDocument, deleteDocument } from "./actions";

async function logout() {
  "use server";
  await clearSession();
  redirect("/login");
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const owned = await prisma.document.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>{user.name}</span>
          <form action={logout}>
            <button className="rounded-md border border-zinc-200 px-3 py-1 hover:border-zinc-400 dark:border-zinc-800">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            My documents
          </h2>
          <form action={createDocument}>
            <button className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
              New document
            </button>
          </form>
        </div>

        {owned.length === 0 ? (
          <p className="mt-6 text-zinc-500">
            No documents yet. Create your first one.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
            {owned.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between py-3"
              >
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex flex-col hover:underline"
                >
                  <span className="font-medium">{doc.title}</span>
                  <span className="text-xs text-zinc-500">
                    Edited {formatDate(doc.updatedAt)}
                  </span>
                </Link>
                <form action={deleteDocument.bind(null, doc.id)}>
                  <button className="text-sm text-zinc-500 hover:text-red-600">
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
