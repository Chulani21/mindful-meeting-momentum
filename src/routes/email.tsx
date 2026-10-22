import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Disclaimer, PageHeader } from "@/components/AppShell";
import { generateEmail } from "@/lib/ai.functions";
import { useStats } from "@/lib/store";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — WorkPilot AI" },
      { name: "description", content: "Generate professional emails in formal, friendly or persuasive tones." },
      { property: "og:title", content: "Smart Email Generator — WorkPilot AI" },
      { property: "og:description", content: "Generate, edit and copy professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

type Tone = "formal" | "friendly" | "persuasive";

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const { bump } = useStats();
  const [form, setForm] = useState({ recipient: "", purpose: "", details: "", tone: "formal" as Tone });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    if (form.purpose.trim().length < 5) return setError("Please describe the purpose of the email (at least 5 characters).");
    setError(""); setLoading(true);
    try {
      const r = await gen({ data: form });
      if (!r.ok) setError(r.error);
      else { setSubject(r.data.subject); setBody(r.data.body); bump("emails"); }
    } catch { setError("Could not reach the AI service. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <>
      <PageHeader title="Smart Email Generator" desc="Describe what you need and pick a tone." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardContent className="space-y-4 p-5">
          <div className="space-y-2"><Label>Recipient (optional)</Label><Input maxLength={200} value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="e.g. Client, Hiring manager" /></div>
          <div className="space-y-2"><Label>Purpose *</Label><Textarea maxLength={2000} rows={3} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Follow up on last week's proposal" /></div>
          <div className="space-y-2"><Label>Key details (optional)</Label><Textarea maxLength={3000} rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Points to include" /></div>
          <div className="space-y-2"><Label>Tone</Label>
            <ToggleGroup type="single" variant="outline" value={form.tone} onValueChange={(v) => v && setForm({ ...form, tone: v as Tone })} className="justify-start">
              <ToggleGroupItem value="formal">Formal</ToggleGroupItem>
              <ToggleGroupItem value="friendly">Friendly</ToggleGroupItem>
              <ToggleGroupItem value="persuasive">Persuasive</ToggleGroupItem>
            </ToggleGroup>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={run} disabled={loading} className="w-full">{loading ? <Loader2 className="animate-spin" /> : <Sparkles />}{loading ? "Generating…" : "Generate email"}</Button>
        </CardContent></Card>

        <Card><CardContent className="space-y-4 p-5">
          {!body && !loading && <p className="py-16 text-center text-sm text-muted-foreground">Your generated email will appear here — fully editable.</p>}
          {loading && !body && <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>}
          {body && (<>
            <div className="space-y-2"><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <div className="space-y-2"><Label>Body</Label><Textarea rows={14} value={body} onChange={(e) => setBody(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); toast.success("Email copied"); }}><Copy />Copy</Button>
              <Button variant="outline" onClick={run} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} />Regenerate</Button>
            </div>
          </>)}
        </CardContent></Card>
      </div>
      <Disclaimer />
    </>
  );
}
