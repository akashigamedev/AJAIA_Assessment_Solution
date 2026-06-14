import { redirect } from "next/navigation";
import { getCurrentUser, clearSession } from "@/lib/session";

async function logout() {
  "use server";
  await clearSession();
  redirect("/login");
}

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      <p className="mt-8 text-zinc-500">Document list coming next.</p>
    </main>
  );
}
