import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import RichCommentEditor, { RichTextPreview } from "@/components/RichCommentEditor";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { resourceApi } from "@/lib/api";

type Post = { id: string; title: string; content?: string; category?: string; created_at: string; likes: number; views: number };
type Comment = { id: string; post_id: string; user_id?: string; content: string; created_at: string };

const PostDetail = () => {
  const { id = "" } = useParams(); const [comment,setComment]=useState(""); const queryClient=useQueryClient(); const {user}=useAuth(); const navigate=useNavigate();
  const post=useQuery({queryKey:["community-post",id],queryFn:()=>resourceApi.get<Post>("community-posts",id),enabled:Boolean(id)});
  const comments=useQuery({queryKey:["post-comments",id],queryFn:()=>resourceApi.list<Comment>("post-comments",{post_id:id,limit:100}),enabled:Boolean(id)});
  const addComment=useMutation({mutationFn:()=>resourceApi.create("post-comments",{post_id:id,content:comment}),onSuccess:()=>{setComment("");void queryClient.invalidateQueries({queryKey:["post-comments",id]});void queryClient.invalidateQueries({queryKey:["public-conversations"]});}});
  return <DashboardLayout><article className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-7">{post.isLoading?<p>Loading…</p>:post.error?<p className="text-destructive">{post.error.message}</p>:<><p className="text-xs text-muted-foreground">{post.data?.category} · {post.data&&new Date(post.data.created_at).toLocaleString()}</p><h1 className="mt-2 font-heading text-3xl font-bold">{post.data?.title}</h1><p className="mt-5 whitespace-pre-wrap text-sm leading-7">{post.data?.content}</p><p className="mt-6 text-xs text-muted-foreground">{post.data?.likes} likes · {post.data?.views} views</p><section className="mt-8 border-t pt-7"><div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary"/><h2 className="font-heading text-lg font-bold">Community replies</h2></div><span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">{comments.data?.total??0} replies</span></div><div className="max-h-[520px] space-y-4 overflow-y-auto pr-2">{comments.isLoading?<p>Loading comments…</p>:comments.data?.rows?.length?comments.data.rows.map(item=><div key={item.id} className="rounded-xl border bg-background p-5 shadow-sm"><RichTextPreview value={item.content}/><p className="mt-4 border-t pt-3 text-xs text-muted-foreground">Posted {new Date(item.created_at).toLocaleString()}</p></div>):<p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No replies yet. Start the conversation.</p>}</div><div className="mt-8"><h3 className="mb-3 font-heading font-bold">Reply to the topic</h3>{user?<><RichCommentEditor value={comment} onChange={setComment}/>{addComment.error&&<p className="mt-2 text-sm text-destructive">{addComment.error.message}</p>}<div className="mt-4 flex justify-end"><Button onClick={()=>addComment.mutate()} disabled={!comment.trim()||addComment.isPending}>{addComment.isPending?"Posting…":"Post reply"}<Send className="ml-2 h-4 w-4"/></Button></div></>:<div className="rounded-xl border border-dashed p-6 text-center"><p className="text-sm text-muted-foreground">Sign in to join this conversation.</p><Button className="mt-3" onClick={()=>navigate("/login")}>Sign in</Button></div>}</div></section></>}</article></DashboardLayout>;
};
export default PostDetail;
