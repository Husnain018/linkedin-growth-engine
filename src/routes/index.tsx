import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, CalendarClock, BarChart3, Linkedin, Bot, ImageIcon, Mail } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Pulseline — Your AI LinkedIn Growth Manager" },
      {
        name: "description",
        content:
          "Pulseline is an autonomous AI agent that researches, writes, schedules, and publishes high-engagement LinkedIn posts for you, every day.",
      },
      { property: "og:title", content: "Pulseline — Your AI LinkedIn Growth Manager" },
      {
        property: "og:description",
        content:
          "Hand off your LinkedIn presence to a senior AI ghostwriter that posts on autopilot.",
      },
    ],
  }),
});

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground bg-aurora">
      <header className="px-6 md:px-12 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
            <Linkedin className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold text-lg">Pulseline</span>
        </div>
        <Link
          to="/login"
          className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
        >
          Sign in
        </Link>
      </header>

      <section className="max-w-5xl mx-auto px-6 md:px-12 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/50 backdrop-blur text-xs text-muted-foreground mb-8">
          <span className="size-1.5 rounded-full bg-success animate-pulse" /> Powered by Lovable AI
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-semibold tracking-tight mb-6">
          Your <span className="text-gradient">autonomous</span><br />LinkedIn growth manager
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Pulseline researches trends, writes in your voice, designs visuals, and publishes
          to LinkedIn on a schedule. You set the strategy — the agent does the work.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium shadow-glow hover:opacity-90 transition"
          >
            Start posting on autopilot
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-32 grid md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="size-10 rounded-lg bg-secondary grid place-items-center mb-4">
              <f.icon className="size-5 text-primary-glow" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Built with Lovable. Posts via the official LinkedIn API — your account stays safe.
      </footer>
    </div>
  );
}

const features = [
  { icon: Bot, title: "Senior AI ghostwriter", body: "Trained on high-performing LinkedIn voice. Writes hooks, stories, and CTAs that sound like you — not a robot." },
  { icon: Sparkles, title: "Topic research", body: "The agent generates fresh, relevant post ideas tailored to your niche, audience, and brand voice." },
  { icon: ImageIcon, title: "AI visuals", body: "Generate quote cards, branded images, and carousel slides that match the post — no design tools needed." },
  { icon: CalendarClock, title: "Smart scheduling", body: "Pick a daily time. Posts publish themselves through LinkedIn's official API. Retries on failure." },
  { icon: BarChart3, title: "Live dashboard", body: "Track scheduled, published, and failed posts. See your agent's activity log in real time." },
  { icon: Mail, title: "Notifications", body: "Get notified when posts publish, fail, or need approval. Stay in control without the busywork." },
];
