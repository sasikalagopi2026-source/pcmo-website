import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Download, FileText, Filter, Newspaper, Search, Share2, ShoppingCart, Star, Repeat2 } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { api, getToken, resourceApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/useCurrency";

type MediaAsset = { name: string; url?: string; download_url?: string; mimeType?: string };
type LibraryItem = {
  id: string;
  title: string;
  excerpt?: string;
  body?: string;
  type: string;
  category?: string;
  subcategory?: string;
  author?: string;
  status: string;
  featured_image?: string;
  tags?: string[];
  attachments?: MediaAsset[];
  flags?: Record<string, boolean>;
  visibility?: Record<string, boolean>;
  sale_enabled?: boolean | number;
  price?: number;
  currency?: string;
  isbn?: string;
  book_format?: string;
  page_count?: number;
  views: number;
  downloads: number;
  shares: number;
  reposts: number;
  published_at?: string;
};

const typeGroups = [
  { title: "Latest News & Updates", types: ["news", "project update", "contract update"], icon: Newspaper },
  { title: "Industry Insights", types: ["insight", "article", "blog", "case study", "reference"], icon: BookOpen },
  { title: "Publications, Research & Standards", types: ["report", "research paper", "white paper", "publication", "standard", "guide", "ebook", "book"], icon: FileText },
  { title: "Webinars, Podcasts & Media", types: ["webinar", "podcast", "video", "event recording", "audio", "presentation", "infographic"], icon: BookOpen },
  { title: "Templates, Tools & Downloads", types: ["download", "template", "toolkit", "worksheet", "checklist"], icon: Download },
];

const Library = () => {
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const filters = {
    search,
    status: "published",
    limit: 100,
    ...(category !== "all" ? { category } : {}),
    ...(type !== "all" ? { type } : {}),
  };
  const { data, isLoading, error } = useQuery({ queryKey: ["library", filters], queryFn: () => resourceApi.list<LibraryItem>("library", filters) });
  const purchases = useQuery({ queryKey: ["book-purchases"], queryFn: () => api<Array<{ book_id: string; status: string }>>("/api/books/purchases") });
  const items = data?.rows ?? [];
  const purchasedIds = new Set((purchases.data ?? []).map((item) => item.book_id));
  const categories = useMemo(() => [...new Set(items.map((item) => item.category).filter(Boolean))] as string[], [items]);
  const types = useMemo(() => [...new Set(items.map((item) => item.type).filter(Boolean))], [items]);
  const visibleItems = items.filter((item) => item.visibility?.library !== false);
  const featured = visibleItems.filter((item) => item.flags?.featured || item.flags?.recommended || item.flags?.trending).slice(0, 4);

  const track = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "share" | "repost" | "download" }) =>
      api(`/api/library/${id}/${action}`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["library"] }),
  });
  const checkout = useMutation({
    mutationFn: (id: string) => api<{ checkoutUrl?: string; status: string }>(`/api/books/${id}/checkout`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["book-purchases"] });
    },
  });
  const downloadFile = async (item: LibraryItem, file: MediaAsset) => {
    const endpoint = file.download_url || file.url;
    if (!endpoint) return;
    if (!file.download_url) {
      track.mutate({ id: item.id, action: "download" });
      window.location.href = endpoint;
      return;
    }
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    });
    if (!response.ok) throw new Error("Unable to download this file");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name || item.title;
    link.click();
    URL.revokeObjectURL(url);
  };

  const contentCard = (item: LibraryItem) => {
    const isPaidBook = Boolean(item.sale_enabled) && Number(item.price ?? 0) > 0;
    const purchased = purchasedIds.has(item.id);
    return (
    <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
      {item.featured_image && item.visibility?.image !== false && <img src={item.featured_image} alt="" className="aspect-video w-full object-cover" />}
      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{item.type}</Badge>
          {item.category && <Badge variant="secondary">{item.category}</Badge>}
          {item.flags?.trending && <Badge>Trending</Badge>}
          {item.flags?.popular && <Badge>Popular</Badge>}
        </div>
        <h2 className="mt-3 font-heading text-lg font-semibold">{item.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.excerpt || item.body}</p>
        {item.sale_enabled && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <Badge variant={purchased ? "secondary" : "default"}>{purchased ? "Purchased" : Number(item.price ?? 0) > 0 ? format(Number(item.price)) : "Free"}</Badge>
            {item.book_format && <span className="text-xs text-muted-foreground">{item.book_format}</span>}
            {item.page_count ? <span className="text-xs text-muted-foreground">{item.page_count} pages</span> : null}
          </div>
        )}
        {item.visibility?.tags !== false && Boolean(item.tags?.length) && (
          <div className="mt-3 flex flex-wrap gap-1">{item.tags?.slice(0, 4).map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button asChild size="sm"><Link to={`/ebook/${item.id}`}>Open</Link></Button>
          {isPaidBook && !purchased && <Button size="sm" variant="outline" disabled={checkout.isPending} onClick={() => checkout.mutate(item.id)}><ShoppingCart className="h-4 w-4" /> Buy</Button>}
          {isPaidBook && purchased && <Button size="sm" variant="outline" disabled><CheckCircle2 className="h-4 w-4" /> Owned</Button>}
          {item.visibility?.sharing !== false && <Button size="icon" variant="outline" onClick={() => { void navigator.clipboard?.writeText(`${window.location.origin}/ebook/${item.id}`); track.mutate({ id: item.id, action: "share" }); }}><Share2 className="h-4 w-4" /></Button>}
          {item.visibility?.repost !== false && <Button size="icon" variant="outline" onClick={() => track.mutate({ id: item.id, action: "repost" })}><Repeat2 className="h-4 w-4" /></Button>}
          {item.visibility?.downloads !== false && item.attachments?.[0] && (!isPaidBook || purchased) && (
            <Button size="icon" variant="outline" onClick={() => void downloadFile(item, item.attachments![0])}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" />
          {item.visibility?.author !== false ? item.author || "PCMO" : "PCMO"}
          {item.visibility?.dates !== false && item.published_at ? ` · ${item.published_at.slice(0, 10)}` : ""}
          {" "}· {item.views} views · {item.downloads} downloads · {item.shares} shares
        </div>
      </div>
    </article>
  );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold">Library</h1>
            <p className="mt-1 text-sm text-muted-foreground">Articles, insights, updates, publications, reports, and downloadable PCMO resources.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> {visibleItems.length} resources</div>
        </div>

        <section className="rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search resources" />
            </div>
            <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{types.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          </div>
        </section>

        {isLoading && <p className="text-sm text-muted-foreground">Loading resources...</p>}
        {error && <p className="text-sm text-destructive">{error.message}</p>}

        {featured.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" /><h2 className="font-heading text-xl font-semibold">Featured Articles</h2></div>
            <div className="grid gap-4 lg:grid-cols-4">{featured.map(contentCard)}</div>
          </section>
        )}

        {typeGroups.map((group) => {
          const groupItems = visibleItems.filter((item) => group.types.includes(item.type.toLowerCase())).slice(0, 12);
          if (!groupItems.length) return null;
          const Icon = group.icon;
          return (
            <section key={group.title} className="space-y-3">
              <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h2 className="font-heading text-xl font-semibold">{group.title}</h2></div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groupItems.map(contentCard)}</div>
            </section>
          );
        })}

        {!isLoading && visibleItems.length === 0 && <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">No published library content.</p>}
      </div>
    </DashboardLayout>
  );
};

export default Library;
