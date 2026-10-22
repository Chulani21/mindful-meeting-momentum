import { useEffect, useState, useCallback } from "react";

export type Priority = "low" | "medium" | "high";
export type Task = { id: string; title: string; priority: Priority; deadline: string; done: boolean; createdAt: number };
export type Stats = { emails: number; summaries: number; schedules: number };

function useLocal<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setVal(JSON.parse(raw));
    } catch {}
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.key === key) setVal(d.value);
    };
    window.addEventListener("wp-store", on);
    return () => window.removeEventListener("wp-store", on);
  }, [key]);
  const set = useCallback(
    (fn: (prev: T) => T) => {
      setVal((prev) => {
        const next = fn(prev);
        localStorage.setItem(key, JSON.stringify(next));
        queueMicrotask(() => window.dispatchEvent(new CustomEvent("wp-store", { detail: { key, value: next } })));
        return next;
      });
    },
    [key],
  );
  return [val, set] as const;
}

export function useTasks() {
  const [tasks, setTasks] = useLocal<Task[]>("wp-tasks", []);
  return {
    tasks,
    add: (t: Omit<Task, "id" | "done" | "createdAt">) =>
      setTasks((p) => [{ ...t, id: crypto.randomUUID(), done: false, createdAt: Date.now() }, ...p]),
    update: (id: string, patch: Partial<Task>) => setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t))),
    remove: (id: string) => setTasks((p) => p.filter((t) => t.id !== id)),
  };
}

export function useStats() {
  const [stats, setStats] = useLocal<Stats>("wp-stats", { emails: 0, summaries: 0, schedules: 0 });
  return { stats, bump: (k: keyof Stats) => setStats((s) => ({ ...s, [k]: s[k] + 1 })) };
}
