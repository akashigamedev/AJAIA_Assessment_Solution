// Initials avatar — first letter of each name part, e.g. "Akash Goyal" -> "AG".
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0]).join("").slice(0, 3).toUpperCase() || "?";
}

export default function Avatar({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900"
    >
      {initials(name)}
    </span>
  );
}
