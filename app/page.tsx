export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Ajaia Docs
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        A lightweight collaborative document editor. Coming together, one
        deploy at a time.
      </p>
    </main>
  );
}
