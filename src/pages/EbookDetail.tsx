import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Download, LockKeyhole, Repeat2, Share2, ShoppingCart } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api, getToken, resourceApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/useCurrency";

type Attachment = { name: string; url?: string; download_url?: string; mimeType?: string };
type Content = {
  id: string;
  title: string;
  body?: string;
  excerpt?: string;
  type?: string;
  category?: string;
  tags?: string[];
  author?: string;
  published_at?: string;
  featured_image?: string;
  attachments?: Attachment[];
  visibility?: Record<string, boolean>;
  sale_enabled?: boolean | number;
  price?: number;
  currency?: string;
  isbn?: string;
  book_format?: string;
  page_count?: number;
  views?: number;
  downloads?: number;
  shares?: number;
  reposts?: number;
};

const EbookDetail = () => {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("");
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { format } = useCurrency();
  const content = useQuery({ queryKey: ["ebook", id], queryFn: () => resourceApi.get<Content>("library", id), enabled: Boolean(id) });
  const access = useQuery({
    queryKey: ["book-access", id],
    queryFn: () => api<{ paidRequired: boolean; purchased: boolean }>(`/api/books/${id}/access`),
    enabled: Boolean(id) && Boolean(content.data),
  });
  const track = useMutation({
    mutationFn: (action: "share" | "repost" | "download") => api(`/api/library/${id}/${action}`, { method: "POST", body: JSON.stringify({}) }),
  });
  const checkout = useMutation({
    mutationFn: () => api<{ checkoutUrl?: string; status: string }>(`/api/books/${id}/checkout`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (result) => {
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
        return;
      }
      setMessage("Book added to your library.");
      void queryClient.invalidateQueries({ queryKey: ["book-access", id] });
      void queryClient.invalidateQueries({ queryKey: ["book-purchases"] });
    },
  });
  const item = content.data;
  const isPaidBook = Boolean(item?.sale_enabled) && Number(item?.price ?? 0) > 0;
  const canDownload = access.data ? !access.data.paidRequired || access.data.purchased : !isPaidBook;
  const downloadAttachment = async (file: Attachment) => {
    const endpoint = file.download_url || file.url;
    if (!endpoint) return;
    if (!file.download_url) {
      track.mutate("download");
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
    link.download = file.name || item?.title || "ebook";
    link.click();
    URL.revokeObjectURL(url);
  };
  const openReader = async (file: Attachment) => {
    const endpoint = file.download_url || file.url;
    if (!endpoint) return;
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${getToken() ?? ""}` } });
    if (!response.ok) throw new Error("Unable to open this book");
    if (readerUrl) URL.revokeObjectURL(readerUrl);
    setReaderUrl(URL.createObjectURL(await response.blob()));
  };

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setMessage("Payment received. Your book will unlock once Stripe confirmation is processed.");
      void queryClient.invalidateQueries({ queryKey: ["book-access", id] });
      void queryClient.invalidateQueries({ queryKey: ["book-purchases"] });
    }
    if (searchParams.get("payment") === "cancelled") {
      setMessage("Payment was cancelled. The book was not added to your library.");
    }
  }, [id, queryClient, searchParams]);

  return (
    <DashboardLayout>
      <article className="mx-auto max-w-4xl space-y-6">
        {content.isLoading ? <p>Loading...</p> : content.error ? <p className="text-destructive">{content.error.message}</p> : item && (
          <>
            {item.featured_image && item.visibility?.image !== false && <img src={item.featured_image} alt="" className="aspect-[16/7] w-full rounded-lg object-cover" />}
            <div>
              <div className="flex flex-wrap gap-2">
                {item.type && <Badge variant="outline">{item.type}</Badge>}
                {item.category && <Badge variant="secondary">{item.category}</Badge>}
              </div>
              {item.visibility?.author !== false && <p className="mt-4 text-xs text-muted-foreground">{item.author || "PCMO"}</p>}
              <h1 className="mt-2 font-heading text-3xl font-bold">{item.title}</h1>
              {item.visibility?.dates !== false && item.published_at && <p className="mt-2 text-sm text-muted-foreground">Published {item.published_at.slice(0, 10)}</p>}
              {item.sale_enabled && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant={canDownload ? "secondary" : "default"}>{canDownload ? "Owned" : Number(item.price ?? 0) > 0 ? format(Number(item.price)) : "Free"}</Badge>
                  {item.book_format && <span className="text-sm text-muted-foreground">{item.book_format}</span>}
                  {item.page_count ? <span className="text-sm text-muted-foreground">{item.page_count} pages</span> : null}
                  {item.isbn && <span className="text-sm text-muted-foreground">ISBN {item.isbn}</span>}
                </div>
              )}
            </div>
            {message && <p className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">{message}</p>}
            {checkout.error && <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{checkout.error.message}</p>}
            {isPaidBook && (
              <section className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">{canDownload ? "Purchased book" : "Buy this book"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{canDownload ? "Downloads are available for your account." : "Purchase unlocks the attached book files for download."}</p>
                  </div>
                  {canDownload
                    ? <Button variant="outline" disabled><CheckCircle2 className="h-4 w-4" /> Owned</Button>
                    : <Button disabled={checkout.isPending} onClick={() => checkout.mutate()}><ShoppingCart className="h-4 w-4" /> Buy {format(Number(item.price ?? 0))}</Button>}
                </div>
              </section>
            )}
            <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-6 leading-7">{item.body || item.excerpt}</div>
            {item.visibility?.tags !== false && Boolean(item.tags?.length) && <div className="flex flex-wrap gap-2">{item.tags?.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>}
            <div className="flex flex-wrap gap-2">
              {item.visibility?.sharing !== false && <Button variant="outline" onClick={() => { void navigator.clipboard?.writeText(window.location.href); track.mutate("share"); }}><Share2 className="h-4 w-4" /> Share</Button>}
              {item.visibility?.repost !== false && <Button variant="outline" onClick={() => track.mutate("repost")}><Repeat2 className="h-4 w-4" /> Repost</Button>}
            </div>
            {item.visibility?.attachments !== false && Boolean(item.attachments?.length) && (
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="font-heading text-lg font-semibold">Downloads</h2>
                {canDownload ? (
                  <div className="mt-3 space-y-2">
                    {item.attachments?.map((file) => (
                      <div key={`${file.name}-${file.download_url || file.url}`} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                        <span className="min-w-0 truncate">{file.name}</span>
                        <div className="flex shrink-0 gap-2">
                          {(file.mimeType === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) && <Button size="sm" variant="outline" onClick={() => void openReader(file)}><BookOpen className="h-4 w-4" /> Read</Button>}
                          <Button size="sm" variant="outline" onClick={() => void downloadAttachment(file)}><Download className="h-4 w-4" /> Download</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-secondary p-4 text-sm text-muted-foreground">
                    <LockKeyhole className="h-4 w-4" />
                    Purchase this book to unlock downloads.
                  </div>
                )}
              </section>
            )}
            {readerUrl && <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex items-center justify-between border-b border-border p-4"><h2 className="font-heading text-lg font-semibold">Read online</h2><Button size="sm" variant="ghost" onClick={() => { URL.revokeObjectURL(readerUrl); setReaderUrl(null); }}>Close reader</Button></div><iframe title={`${item.title} reader`} src={readerUrl} className="h-[70vh] w-full bg-white" /></section>}
          </>
        )}
      </article>
    </DashboardLayout>
  );
};

export default EbookDetail;
