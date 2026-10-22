import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, FileText, ListChecks, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Disclaimer } from "@/components/AppShell";
import { useStats, useTasks } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkPilot AI" },
      { name: "description", content: "Your AI productivity dashboard: emails, meeting summaries and task plans." },
      { property: "og:title", content: "WorkPilot AI — Work smarter. Plan better. Achieve more." },
      { property: "og:description", content: "AI-powered workplace productivity assistant." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { tasks } = useTasks();
  const { stats } = useStats();
  const done = tasks.filter((t) => t.done).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => !t.done && t.deadline && t.deadline < today).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks.filter((t) => !t.done).sort((a, b) => (a.deadline || "9").localeCompare(b.deadline || "9")).slice(0, 5);

  const cards = [
    { label: "Emails generated", value: stats.emails, icon: Mail },
    { label: "Meetings summarized", value: stats.summaries, icon: FileText },
    { label: "Tasks completed", value: `${done}/${tasks.length}`, icon: CheckCircle2 },
    { label: "Overdue tasks", value: overdue, icon: AlertTriangle },
  ];
  const tools = [
    { to: "/email", title: "Smart Email Generator", desc: "Formal, friendly or persuasive emails in seconds.", icon: Mail },
    { to: "/meetings", title: "Meeting Notes Summarizer", desc: "Key points, decisions and action items.", icon: FileText },
    { to: "/planner", title: "AI Task Planner", desc: "Prioritized daily or weekly schedules.", icon: ListChecks },
  ] as const;

  return (
    <>
      <section className="bg-hero rounded-2xl p-6 text-primary-foreground md:p-10">
        <p className="text-sm opacity-80">WorkPilot AI</p>
        <h1 className="font-display mt-2 text-3xl font-semibold md:text-4xl">Work smarter. Plan better. Achieve more.</h1>
        <p className="mt-3 max-w-xl opacity-85">Your AI assistant for emails, meetings and planning — all in one workspace.</p>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-5">
              <div className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground"><c.icon className="size-5" /></div>
              <div>
                <div className="font-display text-2xl font-semibold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Task completion</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end justify-between"><span className="font-display text-3xl font-semibold">{pct}%</span><span className="text-sm text-muted-foreground">{stats.schedules} schedules generated</span></div>
            <Progress value={pct} />
            <div className="space-y-2">
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No open tasks. Add some in the Task Planner.</p>}
              {upcoming.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <span className="truncate">{t.title}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Clock className="size-3" />{t.deadline || "No deadline"}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          {tools.map((t) => (
            <Link key={t.to} to={t.to} className="group flex items-start gap-3 rounded-xl border bg-card p-4 transition hover:border-primary">
              <t.icon className="mt-0.5 size-5 text-primary" />
              <div className="flex-1"><div className="font-medium">{t.title}</div><div className="text-sm text-muted-foreground">{t.desc}</div></div>
              <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
      <Disclaimer />
    </>
  );
}
