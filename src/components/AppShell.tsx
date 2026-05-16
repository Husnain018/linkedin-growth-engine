import { Link, useLocation, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Sparkles, CalendarClock, History, Settings, LogOut, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/composer", label: "AI Composer", icon: Sparkles },
  { to: "/queue", label: "Queue", icon: CalendarClock },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const loc = useLocation();
  const nav2 = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="px-6 py-6 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Linkedin className="size-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-semibold text-sidebar-foreground">Pulseline</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI LinkedIn Agent</div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => {
            const active = loc.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/40",
                )}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground truncate mb-2">{email ?? "—"}</div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              nav2({ to: "/login" });
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
