import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardData } from "@/lib/dashboard.functions";
import { CalendarClock, CheckCircle2, AlertTriangle, FileText, Sparkles, ExternalLink, Linkedin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Pulseline" }] }),
});

function Dashboard() {
  const fn = useServerFn(getDashboardData);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fn() });

  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const { stats, posts, logs, linkedin, settings } = data;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <header className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {settings?.autopilot_enabled ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-success animate-pulse" /> Autopilot active —
                publishing daily at {settings.daily_post_time}
              </span>
            ) : (
              <span>Autopilot is off. Schedule posts manually or enable it in Settings.</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/composer"
            className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-glow"
          >
            <Sparkles className="size-4 inline mr-1.5 -mt-0.5" /> New post
          </Link>
        </div>
      </header>

      {!linkedin && (
        <div className="mb-8 rounded-2xl border border-warning/40 bg-warning/10 p-5 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium text-warning">Connect your LinkedIn account</div>
            <div className="text-sm text-muted-foreground">
              Pulseline can't publish until you connect LinkedIn through the official API.
            </div>
          </div>
          <Link to="/settings" className="px-4 py-2 rounded-lg bg-warning text-warning-foreground text-sm font-medium">
            <Linkedin className="size-4 inline mr-1.5 -mt-0.5" /> Connect
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat icon={FileText} label="Drafts" value={stats.drafts} tone="muted" />
        <Stat icon={CalendarClock} label="Scheduled" value={stats.scheduled} tone="primary" />
        <Stat icon={CheckCircle2} label="Published" value={stats.published} tone="success" />
        <Stat icon={AlertTriangle} label="Failed" value={stats.failed} tone="destructive" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Recent activity</h2>
          {posts.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No posts yet. <Link to="/composer" className="text-primary-glow underline">Create your first one →</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {posts.slice(0, 8).map((p) => (
                <li key={p.id} className="flex items-start gap-3 text-sm">
                  <StatusDot status={p.status} />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-foreground">
                      {p.topic || p.content.slice(0, 80) + "…"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.status} · {p.scheduled_for
                        ? `for ${new Date(p.scheduled_for).toLocaleString()}`
                        : `created ${formatDistanceToNow(new Date(p.created_at))} ago`}
                    </div>
                  </div>
                  {p.linkedin_post_url && (
                    <a href={p.linkedin_post_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold mb-4">Agent log</h2>
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            <ul className="space-y-3 text-xs">
              {logs.slice(0, 12).map((l) => (
                <li key={l.id} className="flex gap-2">
                  <span
                    className={
                      l.level === "error"
                        ? "text-destructive"
                        : l.level === "warn"
                        ? "text-warning"
                        : "text-success"
                    }
                  >
                    ●
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-foreground">{l.message ?? l.action}</div>
                    <div className="text-muted-foreground">
                      {formatDistanceToNow(new Date(l.created_at))} ago
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: "muted" | "primary" | "success" | "destructive";
}) {
  const colorMap = {
    muted: "text-muted-foreground",
    primary: "text-primary-glow",
    success: "text-success",
    destructive: "text-destructive",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${colorMap[tone]}`} />
      </div>
      <div className="font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted-foreground",
    scheduled: "bg-primary-glow",
    publishing: "bg-warning animate-pulse",
    published: "bg-success",
    failed: "bg-destructive",
    cancelled: "bg-muted-foreground",
  };
  return <span className={`mt-1.5 size-2 rounded-full shrink-0 ${map[status] ?? "bg-muted"}`} />;
}
