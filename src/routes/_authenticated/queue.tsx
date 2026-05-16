import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPosts, cancelSchedule, deletePost } from "@/lib/posts.functions";
import { publishNow } from "@/lib/linkedin.functions";
import { CalendarClock, Send, Trash2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/queue")({
  component: Queue,
  head: () => ({ meta: [{ title: "Queue — Pulseline" }] }),
});

function Queue() {
  const qc = useQueryClient();
  const fn = useServerFn(listPosts);
  const cancel = useServerFn(cancelSchedule);
  const del = useServerFn(deletePost);
  const pub = useServerFn(publishNow);

  const { data, isLoading } = useQuery({
    queryKey: ["posts", "scheduled"],
    queryFn: () => fn({ data: { status: "scheduled" } }),
  });
  const drafts = useQuery({
    queryKey: ["posts", "draft"],
    queryFn: () => fn({ data: { status: "draft" } }),
  });

  const cancelM = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => {
      toast.success("Schedule cancelled");
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
  const pubM = useMutation({
    mutationFn: (id: string) => pub({ data: { post_id: id } }),
    onSuccess: () => {
      toast.success("Published");
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-semibold mb-2">Queue</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Posts scheduled to publish automatically, plus your saved drafts.
      </p>

      <Section title="Scheduled" icon={CalendarClock}>
        {isLoading ? (
          <Skeleton />
        ) : !data?.posts.length ? (
          <Empty text="Nothing scheduled. Compose a post and pick a date." />
        ) : (
          data.posts.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              actions={
                <>
                  <IconBtn onClick={() => pubM.mutate(p.id)} disabled={pubM.isPending} title="Publish now">
                    <Send className="size-4" />
                  </IconBtn>
                  <IconBtn onClick={() => cancelM.mutate(p.id)} title="Cancel schedule">
                    <X className="size-4" />
                  </IconBtn>
                  <IconBtn onClick={() => delM.mutate(p.id)} title="Delete">
                    <Trash2 className="size-4" />
                  </IconBtn>
                </>
              }
            />
          ))
        )}
      </Section>

      <Section title="Drafts">
        {drafts.isLoading ? (
          <Skeleton />
        ) : !drafts.data?.posts.length ? (
          <Empty text="No drafts yet." />
        ) : (
          drafts.data.posts.map((p) => (
            <PostRow
              key={p.id}
              post={p}
              actions={
                <>
                  <IconBtn onClick={() => pubM.mutate(p.id)} disabled={pubM.isPending} title="Publish now">
                    <Send className="size-4" />
                  </IconBtn>
                  <IconBtn onClick={() => delM.mutate(p.id)} title="Delete">
                    <Trash2 className="size-4" />
                  </IconBtn>
                </>
              }
            />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: any; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
        {Icon && <Icon className="size-4 text-primary-glow" />}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function PostRow({ post, actions }: { post: any; actions: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card flex items-start gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">
          {post.scheduled_for
            ? `Scheduled · ${new Date(post.scheduled_for).toLocaleString()}`
            : `Draft · ${new Date(post.created_at).toLocaleString()}`}
          {" · "}
          <span className="capitalize">{post.type}</span>
        </div>
        <div className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap">{post.content}</div>
      </div>
      <div className="flex gap-1.5">{actions}</div>
    </div>
  );
}

function IconBtn({ children, ...props }: any) {
  return (
    <button
      {...props}
      className="size-8 grid place-items-center rounded-lg border border-border hover:bg-secondary disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="text-muted-foreground text-sm flex items-center gap-2">
      <Loader2 className="size-3 animate-spin" /> Loading…
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">{text}</div>;
}
