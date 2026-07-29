import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { resourceApi } from "@/lib/api";

type Content = { id: string; slug: string; title: string; body?: string; excerpt?: string; author?: string; published_at?: string; featured_image?: string };

const BlogPost = () => {
  const { slug = "" } = useParams();
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const navigate = useNavigate();

  const query = useQuery({ queryKey: ["blog", slug], queryFn: () => resourceApi.list<Content>("library", { search: slug, status: "published", limit: 100 }) });
  const post = query.data?.rows.find((item) => item.slug === slug);

  type Comment = { id: string; post_id: string; user_id?: string; content: string; created_at: string };
  const comments = useQuery({
    queryKey: ["post-comments", post?.id],
    queryFn: () => resourceApi.list<Comment>("post-comments", { post_id: post?.id, limit: 100 }),
    enabled: Boolean(post?.id),
  });

  const addComment = useMutation({
    mutationFn: () => resourceApi.create("post-comments", { post_id: post?.id, content: comment }),
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", post?.id] });
    },
  });

  return (
    <DashboardLayout>
      <article className="max-w-3xl rounded-xl border border-border bg-card p-8">
        {query.isLoading ? (
          <p>Loading…</p>
        ) : !post ? (
          <p>Article not found.</p>
        ) : (
          <>
            {post.featured_image && <img src={post.featured_image} alt="" className="mb-6 aspect-video w-full rounded-xl object-cover" />}
            <p className="text-xs text-muted-foreground">{post.author} · {post.published_at}</p>
            <h1 className="mt-2 font-heading text-3xl font-bold">{post.title}</h1>
            <p className="mt-6 whitespace-pre-wrap leading-7">{post.body || post.excerpt}</p>

            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold">Comments</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.isLoading ? <p>Loading comments…</p> : comments.data?.rows?.length ? comments.data.rows.map((c) => (
                  <div key={c.id} className="rounded-lg bg-secondary p-3 text-sm">
                    {c.content}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No comments yet.</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment" className="flex-1 rounded border px-3 py-2" disabled={!user} />
                <button onClick={() => { if (!user) return navigate("/login"); addComment.mutate(); }} disabled={!comment.trim() || !user} className="btn btn-primary">Post</button>
                {!user && <button onClick={() => navigate("/login")} className="btn">Sign in</button>}
              </div>
            </section>
          </>
        )}
      </article>
    </DashboardLayout>
  );
};

export default BlogPost;
