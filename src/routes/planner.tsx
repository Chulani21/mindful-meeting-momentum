import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Disclaimer, PageHeader } from "@/components/AppShell";
import { planSchedule, type Schedule } from "@/lib/ai.functions";
import { useStats, useTasks, type Priority, type Task } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — WorkPilot AI" },
      { name: "description", content: "Manage tasks and generate AI daily or weekly schedules." },
      { property: "og:title", content: "AI Task Planner — WorkPilot AI" },
      { property: "og:description", content: "Prioritize tasks and get suggested schedules with AI." },
    ],
  }),
  component: PlannerPage,
});

const prioVariant: Record<Priority, "destructive" | "default" | "secondary"> = { high: "destructive", medium: "default", low: "secondary" };

function PrioritySelect({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Priority)}>
      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent>
    </Select>
  );
}

function TaskRow({ t, update, remove }: { t: Task; update: (id: string, p: Partial<Task>) => void; remove: (id: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [d, setD] = useState(t);
  if (edit) return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
      <Input className="min-w-40 flex-1" value={d.title} maxLength={300} onChange={(e) => setD({ ...d, title: e.target.value })} />
      <PrioritySelect value={d.priority} onChange={(p) => setD({ ...d, priority: p })} />
      <Input type="date" className="w-40" value={d.deadline} onChange={(e) => setD({ ...d, deadline: e.target.value })} />
      <Button size="icon" aria-label="Save" disabled={!d.title.trim()} onClick={() => { update(t.id, { title: d.title.trim(), priority: d.priority, deadline: d.deadline }); setEdit(false); }}><Check /></Button>
      <Button size="icon" variant="ghost" aria-label="Cancel" onClick={() => { setD(t); setEdit(false); }}><X /></Button>
    </div>
  );
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Checkbox checked={t.done} onCheckedChange={(c) => update(t.id, { done: !!c })} aria-label="Complete task" />
      <span className={`flex-1 ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
      <Badge variant={prioVariant[t.priority]} className="capitalize">{t.priority}</Badge>
      <span className="hidden text-xs text-muted-foreground sm:inline">{t.deadline || "No deadline"}</span>
      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setD(t); setEdit(true); }}><Pencil /></Button>
      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(t.id)}><Trash2 /></Button>
    </div>
  );
}

function PlannerPage() {
  const { tasks, add, update, remove } = useTasks();
  const { bump } = useStats();
  const plan = useServerFn(planSchedule);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState("");
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [sched, setSched] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = tasks.filter((t) => !t.done);

  async function generate() {
    if (!open.length) return setError("Add at least one open task first.");
    setError(""); setLoading(true);
    try {
      const r = await plan({ data: { mode, today: new Date().toDateString(), tasks: open.map(({ title, priority, deadline }) => ({ title, priority, deadline })) } });
      if (!r.ok) setError(r.error); else { setSched(r.data); bump("schedules"); }
    } catch { setError("Could not reach the AI service. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <PageHeader title="AI Task Planner" desc="Add tasks, set priorities and deadlines, then let AI suggest a schedule." />
      <Card><CardContent className="p-5">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (!title.trim()) return; add({ title: title.trim(), priority, deadline }); setTitle(""); setDeadline(""); }}>
          <Input className="min-w-48 flex-1" maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task…" />
          <PrioritySelect value={priority} onChange={setPriority} />
          <Input type="date" className="w-40" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Button type="submit" disabled={!title.trim()}><Plus />Add</Button>
        </form>
      </CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Tasks ({open.length} open)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {!tasks.length && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
            {tasks.map((t) => <TaskRow key={t.id} t={t} update={update} remove={remove} />)}
          </CardContent></Card>

        <Card><CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Suggested schedule</CardTitle>
          <div className="flex gap-2">
            <ToggleGroup type="single" variant="outline" size="sm" value={mode} onValueChange={(v) => v && setMode(v as "daily" | "weekly")}>
              <ToggleGroupItem value="daily">Daily</ToggleGroupItem><ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
            </ToggleGroup>
            <Button size="sm" onClick={generate} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}Generate</Button>
          </div></CardHeader>
          <CardContent className="space-y-3">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {loading && <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>}
            {!loading && !sched && <p className="text-sm text-muted-foreground">Generate a plan based on your open tasks.</p>}
            {!loading && sched && (<>
              <p className="text-sm text-muted-foreground">{sched.overview}</p>
              {sched.blocks.map((b, i) => (
                <div key={i} className="rounded-lg border-l-4 border-primary bg-muted/50 p-3">
                  <input className="w-full bg-transparent text-xs font-semibold text-primary outline-none" value={b.when} onChange={(e) => { const bl = [...sched.blocks]; bl[i] = { ...b, when: e.target.value }; setSched({ ...sched, blocks: bl }); }} />
                  <input className="w-full bg-transparent font-medium outline-none" value={b.task} onChange={(e) => { const bl = [...sched.blocks]; bl[i] = { ...b, task: e.target.value }; setSched({ ...sched, blocks: bl }); }} />
                  {b.note && <p className="text-xs text-muted-foreground">{b.note}</p>}
                </div>
              ))}
            </>)}
          </CardContent></Card>
      </div>
      <Disclaimer />
    </>
  );
}
