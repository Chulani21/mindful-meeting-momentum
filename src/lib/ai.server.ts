// Server-only helper: calls Lovable AI Gateway (Responses API) with streaming + strict JSON schema.
const URL_ = "https://ai.gateway.lovable.dev/v1/responses";
const MODEL = "openai/gpt-6-astra";

export class AIError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export async function callAI<T>(opts: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new AIError("AI service is not configured.", 500);

  const res = await fetch(URL_, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: opts.instructions,
      input: opts.input,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      text: {
        format: { type: "json_schema", name: opts.schemaName, strict: true, schema: opts.schema },
      },
    }),
  });

  if (!res.ok || !res.body) {
    let msg = "The AI service returned an error.";
    try {
      const j = await res.json();
      msg = j?.error?.message || j?.message || msg;
    } catch {}
    if (res.status === 429) msg = "Too many requests right now. Please wait a moment and try again.";
    if (res.status === 402) msg = "AI credits are exhausted. Please add credits to continue.";
    console.error("AI gateway error", res.status, msg);
    throw new AIError(msg, res.status);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let refused = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
          else if (ev.type === "response.refusal.delta") refused = true;
          else if (ev.type === "response.failed" || ev.type === "error") {
            throw new AIError(ev?.response?.error?.message || ev?.message || "AI generation failed.");
          }
        } catch (e) {
          if (e instanceof AIError) throw e;
        }
      }
    }
  }
  if (refused) throw new AIError("The AI declined this request. Please revise your input.", 400);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new AIError("The AI returned an unexpected response. Please try again.");
  }
}
