"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type Theme = "system" | "light" | "dark";

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

// Read the saved preference as an external store so there's no setState-in-
// effect and SSR stays consistent (server snapshot is always "system").
function subscribe(cb: () => void) {
  window.addEventListener("ajaia:theme", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("ajaia:theme", cb);
    window.removeEventListener("storage", cb);
  };
}
const getSnapshot = (): Theme =>
  (localStorage.getItem("theme") as Theme) || "system";
const getServerSnapshot = (): Theme => "system";

export default function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    apply(theme);
    // In system mode, follow OS changes too.
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function choose(next: Theme) {
    localStorage.setItem("theme", next);
    window.dispatchEvent(new Event("ajaia:theme"));
  }

  const options: { value: Theme; icon: typeof Monitor; label: string }[] = [
    { value: "system", icon: Monitor, label: "System theme" },
    { value: "light", icon: Sun, label: "Light theme" },
    { value: "dark", icon: Moon, label: "Dark theme" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => choose(value)}
          title={label}
          aria-label={label}
          aria-pressed={theme === value}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            theme === value
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
