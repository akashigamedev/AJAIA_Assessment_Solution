import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSession } from "@/lib/session";

async function login(userId: string) {
  "use server";
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await setSession(user.id);
  redirect("/documents");
}

export default async function LoginPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-100 px-6 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Ajaia Docs
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Pick a user to sign in as.
        </p>
      </div>

      <form className="flex w-full max-w-sm flex-col gap-3">
        {users.map((u) => (
          <button
            key={u.id}
            formAction={login.bind(null, u.id)}
            className="flex flex-col rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
          >
            <span className="font-medium text-black dark:text-zinc-50">
              {u.name}
            </span>
            <span className="text-sm text-zinc-500">{u.email}</span>
          </button>
        ))}
      </form>
    </main>
  );
}
