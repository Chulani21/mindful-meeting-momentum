# WorkPilot AI — AI-Powered Workplace Productivity Assistant

> Work smarter. Plan better. Achieve more.

WorkPilot AI is a responsive SaaS dashboard with three AI features:

1. **Smart Email Generator** — formal, friendly or persuasive emails; edit, copy and regenerate.
2. **Meeting Notes Summarizer** — key points, decisions, action items, owners and deadlines. Missing info is marked "Not specified"; nothing is invented.
3. **AI Task Planner** — add, edit, delete and complete tasks with priorities and deadlines; generate daily or weekly schedules.

The dashboard shows productivity statistics (emails generated, meetings summarized, completion rate, overdue tasks).

## Tech stack
- React 19 + TypeScript, TanStack Start (SSR + server functions), Vite
- Tailwind CSS v4 + shadcn/ui, lucide-react icons
- Lovable AI Gateway (`openai/gpt-6-astra`) called **only from the server** with structured JSON-schema output

## Security & Responsible AI
- The API key (`LOVABLE_API_KEY`) is read server-side only; it never reaches the browser.
- Inputs are validated with Zod on the server and length-limited in the UI.
- Prompts instruct the model never to fabricate facts, decisions or deadlines.
- Every page shows a disclaimer: review AI output and do not submit confidential or sensitive information.
- Tasks and stats are stored in the browser's localStorage.

## Setup
```bash
bun install        # or npm install
echo "LOVABLE_API_KEY=your_key" > .env
bun run dev        # http://localhost:8080
bun run build      # production build
```

## Deploy / GitHub
Connect the project to GitHub from Lovable (Settings → GitHub) and publish from Lovable, or deploy the build to any Cloudflare Workers–compatible host with `LOVABLE_API_KEY` set as a secret.
