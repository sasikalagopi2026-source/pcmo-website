import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, LockKeyhole, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api, resourceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";

type Book = { id: string; title: string; excerpt?: string; type: string; featured_image?: string; author?: string; sale_enabled?: boolean | number; price?: number; book_format?: string; page_count?: number; flags?: Record<string, boolean> };
type CartBook = Book & { cart_item_id: string; currency?: string };

const Bookstore = () => {
  const { format } = useCurrency();
  const client = useQueryClient();
  const [params] = useSearchParams();
  const books = useQuery({ queryKey: ["bookstore"], queryFn: () => resourceApi.list<Book>("library", { status: "published", limit: 100 }) });
  const cart = useQuery({ queryKey: ["book-cart"], queryFn: () => api<CartBook[]>("/api/books/cart") });
  const purchases = useQuery({ queryKey: ["book-purchases"], queryFn: () => api<Array<{ book_id: string }>>("/api/books/purchases") });
  const add = useMutation({ mutationFn: (bookId: string) => api("/api/books/cart", { method: "POST", body: JSON.stringify({ bookId }) }), onSuccess: () => void client.invalidateQueries({ queryKey: ["book-cart"] }) });
  const remove = useMutation({ mutationFn: (bookId: string) => api(`/api/books/cart/${bookId}`, { method: "DELETE" }), onSuccess: () => void client.invalidateQueries({ queryKey: ["book-cart"] }) });
  const checkout = useMutation({
    mutationFn: () => api<{ checkoutUrl?: string }>("/api/books/cart/checkout", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (result) => { if (result.checkoutUrl) window.location.href = result.checkoutUrl; },
  });
  useEffect(() => {
    if (params.get("payment") === "success") {
      const sessionId = params.get("session_id") || params.get("sessionId");
      if (sessionId) {
        (async () => {
          try {
            await api("/api/stripe/confirm-session", { method: "POST", body: JSON.stringify({ sessionId }) });
          } catch (err) {
            // ignore, webhook will reconcile
          } finally {
            void client.invalidateQueries({ queryKey: ["book-cart"] });
            void client.invalidateQueries({ queryKey: ["book-purchases"] });
          }
        })();
      } else {
        void client.invalidateQueries({ queryKey: ["book-cart"] });
        void client.invalidateQueries({ queryKey: ["book-purchases"] });
      }
    }
  }, [client, params]);

  const owned = new Set((purchases.data ?? []).map((purchase) => purchase.book_id));
  const paidBooks = (books.data?.rows ?? []).filter((book) => ["book", "ebook", "guide", "publication"].includes(book.type.toLowerCase()) && Boolean(book.sale_enabled) && Number(book.price ?? 0) > 0);
  const cartItems = cart.data ?? [];
  const cartIds = new Set(cartItems.map((book) => book.id));
  const total = cartItems.reduce((sum, book) => sum + Number(book.price ?? 0), 0);

  return <DashboardLayout>
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-2xl bg-[#11194d] px-6 py-10 text-white shadow-sm md:px-10">
        <div className="grid items-center gap-7 md:grid-cols-[1fr_1.2fr_auto]">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">PCMO publications</p><h1 className="mt-3 font-heading text-4xl font-bold">Professional<br />Bookstore</h1></div>
          <p className="max-w-xl text-lg leading-8 text-white/90">Practical guides, playbooks and digital books built for project and contract management professionals.</p>
          <BookOpen className="h-24 w-24 text-[#f6c65b]" strokeWidth={1.2} />
        </div>
      </section>

      {params.get("payment") === "success" && <p className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-success">Payment received. Your books will appear in your library as soon as Stripe confirms the order.</p>}
      {params.get("payment") === "cancelled" && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">Checkout was cancelled; your cart is still saved.</p>}
      {add.error && <p className="text-sm text-destructive">{add.error.message}</p>}{checkout.error && <p className="text-sm text-destructive">{checkout.error.message}</p>}

      <div className="grid gap-8 xl:grid-cols-[1fr_330px]">
        <section><div className="mb-4 flex items-center justify-between"><div><h2 className="font-heading text-2xl font-bold">Featured books</h2><p className="text-sm text-muted-foreground">Purchase once with your email account; then read or download from any signed-in device.</p></div><Badge variant="outline">{paidBooks.length} titles</Badge></div>
          <div className="grid gap-5 md:grid-cols-2">
            {paidBooks.map((book) => <article key={book.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="flex min-h-48 items-center justify-center bg-gradient-to-br from-[#25245b] via-[#473974] to-[#ec9d64] p-5">{book.featured_image ? <img src={book.featured_image} alt="" className="h-44 w-28 rounded object-cover shadow-xl" /> : <div className="flex h-44 w-28 items-end rounded bg-white/95 p-3 shadow-xl"><span className="text-sm font-bold text-[#151744]">{book.title}</span></div>}</div>
              <div className="p-5"><div className="flex items-center justify-between gap-2"><Badge variant="secondary">Digital book</Badge><span className="font-semibold">{format(Number(book.price ?? 0))}</span></div><h3 className="mt-3 font-heading text-xl font-bold">{book.title}</h3><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{book.excerpt || "A PCMO professional publication."}</p><p className="mt-3 text-xs text-muted-foreground">{book.author || "PCMO"}{book.page_count ? ` · ${book.page_count} pages` : ""}{book.book_format ? ` · ${book.book_format}` : ""}</p>
              <div className="mt-4 flex gap-2"><Button asChild variant="outline" size="sm"><Link to={`/ebook/${book.id}`}>Details</Link></Button>{owned.has(book.id) ? <Button asChild size="sm"><Link to={`/ebook/${book.id}`}><CheckCircle2 className="h-4 w-4" /> Read</Link></Button> : <Button size="sm" disabled={add.isPending || cartIds.has(book.id)} onClick={() => add.mutate(book.id)}><ShoppingCart className="h-4 w-4" /> {cartIds.has(book.id) ? "In cart" : "Add to cart"}</Button>}</div></div>
            </article>)}
            {!books.isLoading && !paidBooks.length && <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">No paid books are published yet. An administrator can create a Book/Ebook in Library Management, upload its PDF, set a price, and publish it.</div>}
          </div>
        </section>
        <aside className="h-fit rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-heading text-xl font-bold">Your cart</h2><ShoppingBag className="h-5 w-5 text-primary" /></div><p className="mt-1 text-xs text-muted-foreground">Saved securely for your signed-in account.</p>
          <div className="mt-5 space-y-3">{cartItems.map((book) => <div key={book.id} className="flex gap-3 border-b border-border pb-3"><div className="flex h-12 w-9 shrink-0 items-end rounded bg-[#29255d] p-1 text-[8px] font-semibold text-white">PCMO</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{book.title}</p><p className="text-sm font-semibold">{format(Number(book.price ?? 0))}</p></div><Button size="icon" variant="ghost" aria-label={`Remove ${book.title}`} disabled={remove.isPending} onClick={() => remove.mutate(book.id)}><Trash2 className="h-4 w-4" /></Button></div>)}{!cartItems.length && <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" /> Your cart is empty.</div>}</div>
          <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold"><span>Total</span><span>{format(total)}</span></div><Button className="mt-4 w-full" disabled={!cartItems.length || checkout.isPending} onClick={() => checkout.mutate()}>Checkout securely</Button><p className="mt-3 text-center text-xs text-muted-foreground">Access is granted to the email account used to sign in.</p>
        </aside>
      </div>
    </div>
  </DashboardLayout>;
};

export default Bookstore;
