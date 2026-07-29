import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Settings, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Room = { id: string; slug: string; name: string; description?: string; category?: string; moderator_name?: string; access_level: string; message_count: number; participant_count: number; last_activity?: string | null };

const AdminCommunityChat = () => {
  const rooms = useQuery({ queryKey: ["admin-chat-rooms"], queryFn: () => api<{ rows: Room[] }>("/api/public/chat-rooms"), refetchInterval: 10000 });
  return <DashboardLayout><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-accent">Community</p><h1 className="mt-2 font-heading text-3xl font-bold">Chat Room Inbox</h1><p className="mt-2 text-sm text-muted-foreground">Open member discussions, reply as an administrator, and monitor activity across rooms.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link to="/admin/manage/community-chat-messages"><ShieldCheck className="mr-2 h-4 w-4"/>Moderate messages</Link></Button><Button asChild><Link to="/admin/manage/community-chat-rooms"><Settings className="mr-2 h-4 w-4"/>Manage rooms</Link></Button></div></div>
    <div className="mt-8 grid gap-5 md:grid-cols-2">{rooms.isLoading ? [1,2,3,4].map(item => <div key={item} className="h-64 animate-pulse rounded-xl bg-muted"/>) : rooms.data?.rows.map(room => <article key={room.id} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10"><MessageCircle className="h-6 w-6 text-primary"/></div>{room.last_activity && <span className="text-xs text-muted-foreground">Last activity {new Date(room.last_activity).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>}</div><p className="mt-5 text-xs font-bold uppercase tracking-widest text-accent">{room.category}</p><h2 className="mt-2 font-heading text-xl font-bold">{room.name}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{room.description}</p><div className="mt-5 flex flex-wrap gap-4 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4"/>{room.message_count} messages</span><span className="flex items-center gap-1.5"><Users className="h-4 w-4"/>{room.participant_count} participants</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4"/>{room.moderator_name || "PCMO"}</span></div><Button asChild className="mt-6 w-full"><Link to={`/admin/community-chat/${room.slug}`}>Open discussion and reply <ArrowRight className="ml-2 h-4 w-4"/></Link></Button></article>)}</div>
  </div></DashboardLayout>;
};
export default AdminCommunityChat;
