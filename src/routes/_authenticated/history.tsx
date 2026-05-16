import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPosts } from "@/lib/posts.functions";
import { ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/history")({
  component: History,
  head: () => ({ meta: [{ title: "History — Pulseline" }] }),
});

function History() {
  const fn = useServerFn(listPosts);
  const { data } = useQuery({ queryKey: ["posts", "all"], queryFn: () => fn({ data: {} }) });
  const posts = (data?.posts ?? []).filter((p) => p.status === "published" || p.status === "failed");

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-2">History</h1>
      <p className="text-sm text-muted-foreground mb-8">Everything Pulseline has tried to publish.</p>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nothing published yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {p.status === "published" ? (
                    <CheckCircle2 className="size-4 text-success" />
                  ) : (
                    <AlertTriangle className="size-4 text-destructive" />
                  )}
                  <span className="capitalize">{p.status}</span>
                  <span>·</span>
                  <span>
                    {p.published_at ? format(new Date(p.published_at), "PPpp") : format(new Date(p.created_at), "PPpp")}
                  </span>
                </div>
                {p.linkedin_post_url && (
                  <a
                    href={p.linkedin_post_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-glow hover:underline inline-flex items-center gap-1"
                  >
                    View on LinkedIn <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap line-clamp-6">{p.content}</p>
              {p.error_message && (
                <div className="mt-3 text-xs text-destructive bg-destructive/10 rounded-lg p-2">{p.error_message}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
