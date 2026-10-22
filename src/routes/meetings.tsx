import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Disclaimer, PageHeader } from "@/components/AppShell";
import { summarizeMeeting, type MeetingSummary } from "@/lib/ai.functions";
import { useStats } from "@/lib/store";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — WorkPilot AI" },
      { name: "description", content: "Turn meeting notes into key points, decisions and action items." },
      { property: "og:title", content: "Meeting Notes Summarizer — WorkPilot AI" },
      { property: "og:description", content: "Summarize meetings with owners and deadlines — nothing invented." },
    ],
  }),
  component: MeetingsPage,
});

function List({ items, onChange }: { items: string[]; onChange: (v: string[]) => void }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None found in the notes.</p>;
  return <Textarea rows={Math.max(3, items.length + 1)} value={items.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} />;
}

function MeetingsPage() {
  const summarize = useServerFn(summarizeMeeting);
  const { bump } = useStats();
  const [notes, setNotes] = useState("");
  const [res, setRes] = useState<MeetingSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (notes.trim().length < 20) return setError("Please paste at least a few lines of meeting notes.");
    setError(""); setLoading(true);
    try {
      const r = await summarize({ data: { notes } });
      if (!r.ok) setError(r.error); else { setRes(r.data); bump("summaries"); }
    } catch { setError("Could not reach the AI service. Please try again."); }
    finally { setLoading(false); }
  }

  function copy() {
    if (!res) return;
    const t = `Summary\n${res.summary}\n\nKey points\n${res.keyPoints.map((x) => `- ${x}`).join("\n")}\n\nDecisions\n${res.decisions.map((x) => `- ${x}`).join("\n")}\n\nAction items\n${res.actionItems.map((a) => `- ${a.task} — ${a.owner} — ${a.deadline}`).join("\n")}`;
    navigator.clipboard.writeText(t); toast.success("Summary copied");
  }

  return (
    <>
      <PageHeader title="Meeting Notes Summarizer" desc="Only information stated in your notes is used — missing details are marked “Not specified”." />
      <Card><CardContent className="space-y-3 p-5">
        <Textarea rows={8} maxLength={15000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste your meeting notes here…" />
        <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{notes.length}/15000</span></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={run} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{loading ? "Summarizing…" : "Summarize notes"}</Button>
      </CardContent></Card>

      {res && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">Summary</CardTitle><Button size="sm" variant="outline" onClick={copy}><Copy />Copy all</Button></CardHeader>
            <CardContent><Textarea rows={3} value={res.summary} onChange={(e) => setRes({ ...res, summary: e.target.value })} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Key points</CardTitle></CardHeader><CardContent><List items={res.keyPoints} onChange={(v) => setRes({ ...res, keyPoints: v })} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Decisions</CardTitle></CardHeader><CardContent><List items={res.decisions} onChange={(v) => setRes({ ...res, decisions: v })} /></CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><CardTitle className="text-base">Action items</CardTitle></CardHeader><CardContent className="overflow-x-auto">
            {!res.actionItems.length ? <p className="text-sm text-muted-foreground">No action items found in the notes.</p> : (
              <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="p-2">Task</th><th className="p-2">Responsible</th><th className="p-2">Deadline</th></tr></thead>
                <tbody>{res.actionItems.map((a, i) => (
                  <tr key={i} className="border-t">{(["task", "owner", "deadline"] as const).map((k) => (
                    <td key={k} className="p-1"><input className="w-full rounded bg-transparent p-1 outline-none focus:bg-muted" value={a[k]} onChange={(e) => { const items = [...res.actionItems]; items[i] = { ...a, [k]: e.target.value }; setRes({ ...res, actionItems: items }); }} /></td>
                  ))}</tr>))}</tbody></table>)}
          </CardContent></Card>
        </div>
      )}
      <Disclaimer />
    </>
  );
}
