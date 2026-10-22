import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Mail, FileText, ListChecks, Sparkles, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarFooter,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Email Generator", url: "/email", icon: Mail },
  { title: "Meeting Summarizer", url: "/meetings", icon: FileText },
  { title: "Task Planner", url: "/planner", icon: ListChecks },
] as const;

function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <div className="font-display text-base font-semibold">WorkPilot AI</div>
            <div className="text-xs text-sidebar-foreground/60">Productivity assistant</div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((i) => (
                <SidebarMenuItem key={i.url}>
                  <SidebarMenuButton asChild isActive={path === i.url} tooltip={i.title}>
                    <Link to={i.url}>
                      <i.icon />
                      <span>{i.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <p className="px-2 pb-2 text-xs text-sidebar-foreground/60">Work smarter. Plan better. Achieve more.</p>
      </SidebarFooter>
    </Sidebar>
  );
}

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground">
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>
        <strong>Responsible AI:</strong> AI-generated content can be inaccurate — always review it before use. Do not
        submit confidential, personal or sensitive information.
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Work smarter. Plan better. Achieve more.</span>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-1 text-muted-foreground">{desc}</p>
    </div>
  );
}
