import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  BarChart3,
  Check,
  Copy,
  Eye,
  FileUp,
  Filter,
  Image,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { api, getToken, resourceApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type LibraryItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body?: string;
  type: string;
  category?: string;
  subcategory?: string;
  tags?: string[];
  author?: string;
  reviewer?: string;
  status: string;
  published_at?: string | null;
  expires_at?: string | null;
  scheduled_at?: string | null;
  featured_image?: string | null;
  gallery?: MediaAsset[];
  media?: MediaAsset[];
  attachments?: MediaAsset[];
  seo?: Record<string, string>;
  flags?: Record<string, boolean>;
  visibility?: Record<string, boolean>;
  sale_enabled?: boolean | number;
  price?: number;
  currency?: string;
  isbn?: string;
  book_format?: string;
  page_count?: number;
  original_id?: string | null;
  display_priority?: number;
  views?: number;
  downloads?: number;
  shares?: number;
  reposts?: number;
  created_at?: string;
  updated_at?: string;
};

type MediaAsset = {
  id?: string;
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  category?: string | null;
};

type MediaRecord = {
  id: string;
  original_name: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  category?: string | null;
  created_at?: string;
};

type LibraryForm = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  type: string;
  category: string;
  subcategory: string;
  tags: string;
  author: string;
  reviewer: string;
  status: string;
  published_at: string;
  expires_at: string;
  scheduled_at: string;
  featured_image: string;
  display_priority: number;
  attachments: MediaAsset[];
  gallery: MediaAsset[];
  media: MediaAsset[];
  seo: Record<string, string>;
  flags: Record<string, boolean>;
  visibility: Record<string, boolean>;
  sale_enabled: boolean;
  price: number;
  currency: string;
  isbn: string;
  book_format: string;
  page_count: number;
};

const contentTypes = ["Article", "Blog", "News", "Insight", "Project Update", "Contract Update", "Report", "Research Paper", "White Paper", "Publication", "Standard", "Book", "Ebook", "Download", "Guide", "Case Study", "Reference", "Template", "Toolkit", "Worksheet", "Checklist", "Webinar", "Podcast", "Video", "Event Recording", "Audio", "Presentation", "Infographic"];
const statuses = ["draft", "scheduled", "published", "hidden", "archived"];
const defaultFlags = { featured: false, trending: false, popular: false, recommended: false };
const defaultVisibility = {
  library: true,
  image: true,
  author: true,
  dates: true,
  tags: true,
  attachments: true,
  downloads: true,
  comments: false,
  sharing: true,
  repost: true,
};

const emptyForm: LibraryForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  type: "Article",
  category: "",
  subcategory: "",
  tags: "",
  author: "PCMO",
  reviewer: "",
  status: "draft",
  published_at: "",
  expires_at: "",
  scheduled_at: "",
  featured_image: "",
  display_priority: 0,
  attachments: [],
  gallery: [],
  media: [],
  seo: { title: "", description: "", keywords: "" },
  flags: defaultFlags,
  visibility: defaultVisibility,
  sale_enabled: false,
  price: 0,
  currency: "USD",
  isbn: "",
  book_format: "Digital",
  page_count: 0,
};

const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const toInputDate = (value?: string | null) => value ? value.slice(0, 16).replace(" ", "T") : "";
const toDbDate = (value: string) => value ? value.replace("T", " ") : null;
const fromItem = (item: LibraryItem): LibraryForm => ({
  title: item.title ?? "",
  slug: item.slug ?? "",
  excerpt: item.excerpt ?? "",
  body: item.body ?? "",
  type: item.type ?? "Article",
  category: item.category ?? "",
  subcategory: item.subcategory ?? "",
  tags: (item.tags ?? []).join(", "),
  author: item.author ?? "PCMO",
  reviewer: item.reviewer ?? "",
  status: item.status ?? "draft",
  published_at: toInputDate(item.published_at),
  expires_at: toInputDate(item.expires_at),
  scheduled_at: toInputDate(item.scheduled_at),
  featured_image: item.featured_image ?? "",
  display_priority: Number(item.display_priority ?? 0),
  attachments: item.attachments ?? [],
  gallery: item.gallery ?? [],
  media: item.media ?? [],
  seo: { title: "", description: "", keywords: "", ...(item.seo ?? {}) },
  flags: { ...defaultFlags, ...(item.flags ?? {}) },
  visibility: { ...defaultVisibility, ...(item.visibility ?? {}) },
  sale_enabled: Boolean(item.sale_enabled),
  price: Number(item.price ?? 0),
  currency: item.currency ?? "USD",
  isbn: item.isbn ?? "",
  book_format: item.book_format ?? "Digital",
  page_count: Number(item.page_count ?? 0),
});

const toPayload = (form: LibraryForm) => ({
  title: form.title,
  slug: form.slug || slugify(form.title),
  excerpt: form.excerpt,
  body: form.body,
  type: form.type,
  category: form.category,
  subcategory: form.subcategory,
  tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
  author: form.author,
  reviewer: form.reviewer,
  status: form.status,
  published_at: toDbDate(form.published_at),
  expires_at: toDbDate(form.expires_at),
  scheduled_at: toDbDate(form.scheduled_at),
  featured_image: form.featured_image,
  display_priority: Number(form.display_priority ?? 0),
  attachments: form.attachments,
  gallery: form.gallery,
  media: form.media,
  seo: form.seo,
  flags: form.flags,
  visibility: form.visibility,
  sale_enabled: form.sale_enabled,
  price: Number(form.price ?? 0),
  currency: form.currency || "USD",
  isbn: form.isbn,
  book_format: form.book_format,
  page_count: Number(form.page_count ?? 0),
});

const AdminLibraryManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<LibraryItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<LibraryForm>(emptyForm);
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [imageSearch, setImageSearch] = useState("");
  const [imageUploadCategory, setImageUploadCategory] = useState("");
  const [imageUploadFiles, setImageUploadFiles] = useState<FileList | null>(null);

  const filters = {
    search,
    limit: 100,
    ...(status !== "all" ? { status } : {}),
    ...(type !== "all" ? { type } : {}),
    ...(category !== "all" ? { category } : {}),
  };
  const query = useQuery({ queryKey: ["admin-library", filters], queryFn: () => resourceApi.list<LibraryItem>("library", filters) });
  const mediaQuery = useQuery({
    queryKey: ["library-media", imageSearch],
    queryFn: () => resourceApi.list<MediaRecord>("library-media", { search: imageSearch, limit: 100 }),
  });
  const rows = query.data?.rows ?? [];
  const images = (mediaQuery.data?.rows ?? []).filter((item) => item.mime_type.startsWith("image/"));

  const categories = useMemo(() => [...new Set(rows.map((item) => item.category).filter(Boolean))] as string[], [rows]);
  const metrics = useMemo(() => {
    const count = (name: string) => rows.filter((item) => item.status === name).length;
    return [
      { label: "Total", value: rows.length },
      { label: "Drafts", value: count("draft") },
      { label: "Published", value: count("published") },
      { label: "Scheduled", value: count("scheduled") },
      { label: "Archived", value: count("archived") },
      { label: "Views", value: rows.reduce((sum, item) => sum + Number(item.views ?? 0), 0) },
      { label: "Downloads", value: rows.reduce((sum, item) => sum + Number(item.downloads ?? 0), 0) },
      { label: "Reposts", value: rows.reduce((sum, item) => sum + Number(item.reposts ?? 0), 0) },
    ];
  }, [rows]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-library"] });
    void queryClient.invalidateQueries({ queryKey: ["library"] });
    void queryClient.invalidateQueries({ queryKey: ["library-media"] });
    setSelected([]);
  };

  const save = useMutation({
    mutationFn: () => editing
      ? resourceApi.update("library", editing.id, toPayload(form))
      : resourceApi.create("library", toPayload(form)),
    onSuccess: () => {
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => resourceApi.remove("library", id),
    onSuccess: invalidate,
  });

  const duplicate = useMutation({
    mutationFn: (item: LibraryItem) => api(`/api/admin/library/${item.id}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ title: `${item.title} Repost`, slug: `${item.slug}-repost-${Date.now().toString().slice(-6)}` }),
    }),
    onSuccess: invalidate,
  });

  const bulk = useMutation({
    mutationFn: (action: string) => api("/api/admin/library/bulk", {
      method: "POST",
      body: JSON.stringify({ ids: selected, action }),
    }),
    onSuccess: invalidate,
  });

  const upload = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      Array.from(uploadFiles ?? []).forEach((file) => data.append("files", file));
      if (uploadCategory) data.append("category", uploadCategory);
      const response = await fetch("/api/admin/library/upload", {
        method: "POST",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: data,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Upload failed");
      return payload as { media: MediaAsset[] };
    },
    onSuccess: (payload) => {
      setForm((current) => ({
        ...current,
        attachments: [...current.attachments, ...payload.media],
        featured_image: current.featured_image || payload.media.find((file) => file.mimeType?.startsWith("image/"))?.url || "",
      }));
      setUploadFiles(null);
      setUploadCategory("");
      invalidate();
    },
  });

  const imageUpload = useMutation({
    mutationFn: async () => {
      const data = new FormData();
      Array.from(imageUploadFiles ?? []).forEach((file) => data.append("files", file));
      if (imageUploadCategory) data.append("category", imageUploadCategory);
      const response = await fetch("/api/admin/library/upload", {
        method: "POST",
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
        body: data,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Image upload failed");
      return payload as { media: MediaAsset[] };
    },
    onSuccess: () => {
      setImageUploadFiles(null);
      setImageUploadCategory("");
      invalidate();
    },
  });

  const deleteMedia = useMutation({
    mutationFn: (id: string) => resourceApi.remove("library-media", id),
    onSuccess: invalidate,
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: LibraryItem) => {
    setEditing(item);
    setForm(fromItem(item));
    setDialogOpen(true);
  };

  const update = <K extends keyof LibraryForm>(key: K, value: LibraryForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const toggleSelected = (id: string) =>
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const assetFromImage = (image: MediaRecord): MediaAsset => ({
    id: image.id,
    name: image.original_name,
    url: image.url,
    mimeType: image.mime_type,
    size: image.size_bytes,
    category: image.category,
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Library Management</h1>
            <p className="mt-1 text-sm text-muted-foreground">Central CMS for articles, updates, publications, reports, media, and downloadable resources.</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> New content</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <section key={metric.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold">{metric.value.toLocaleString()}</p>
            </section>
          ))}
        </div>

        <section className="rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-2">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search title, content, author" />
              </div>
              <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={type} onValueChange={setType}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{contentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={!selected.length || bulk.isPending} onClick={() => bulk.mutate("publish")}><Check className="h-4 w-4" /> Publish</Button>
              <Button size="sm" variant="outline" disabled={!selected.length || bulk.isPending} onClick={() => bulk.mutate("archive")}><Archive className="h-4 w-4" /> Archive</Button>
              <Button size="sm" variant="outline" disabled={!selected.length || bulk.isPending} onClick={() => bulk.mutate("feature")}><Eye className="h-4 w-4" /> Feature</Button>
              <Button size="sm" variant="outline" disabled={!selected.length || bulk.isPending} onClick={() => window.confirm("Delete selected content?") && bulk.mutate("delete")}><Trash2 className="h-4 w-4" /> Delete</Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={rows.length > 0 && selected.length === rows.length} onCheckedChange={(checked) => setSelected(checked ? rows.map((row) => row.id) : [])} /></TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Analytics</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell><Checkbox checked={selected.includes(item.id)} onCheckedChange={() => toggleSelected(item.id)} /></TableCell>
                    <TableCell className="min-w-[280px]">
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.category || "Uncategorized"}{item.subcategory ? ` / ${item.subcategory}` : ""} · {item.author || "PCMO"}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                    <TableCell><Badge variant={item.status === "published" ? "default" : "secondary"}>{item.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.flags ?? {}).filter(([, value]) => value).map(([key]) => <Badge key={key} variant="secondary">{key}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.published_at?.slice(0, 16) || item.scheduled_at?.slice(0, 16) || "Not set"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.views ?? 0} views · {item.downloads ?? 0} downloads · {item.shares ?? 0} shares</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => duplicate.mutate(item)}><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => window.confirm("Delete this content?") && remove.mutate(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!query.isLoading && rows.length === 0 && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No library content matches the current filters.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold">Image Management</h2>
              <p className="text-sm text-muted-foreground">Upload, preview, organize, copy, and remove reusable library images.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input className="w-[220px]" value={imageSearch} onChange={(event) => setImageSearch(event.target.value)} placeholder="Search images" />
              <Input className="w-[160px]" value={imageUploadCategory} onChange={(event) => setImageUploadCategory(event.target.value)} placeholder="Category" />
              <Input className="w-[260px]" type="file" accept="image/*" multiple onChange={(event) => setImageUploadFiles(event.target.files)} />
              <Button variant="outline" disabled={!imageUploadFiles?.length || imageUpload.isPending} onClick={() => imageUpload.mutate()}><Upload className="h-4 w-4" /> Upload images</Button>
            </div>
          </div>
          {imageUpload.error && <p className="px-4 pt-4 text-sm text-destructive">{imageUpload.error.message}</p>}
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {images.map((image) => (
              <article key={image.id} className="overflow-hidden rounded-lg border border-border">
                <img src={image.url} alt="" className="aspect-video w-full object-cover" />
                <div className="space-y-3 p-3">
                  <div>
                    <p className="truncate text-sm font-medium">{image.original_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{image.category || "Uncategorized"} · {Math.round(image.size_bytes / 1024).toLocaleString()} KB</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void navigator.clipboard?.writeText(image.url)}>Copy URL</Button>
                    <Button size="sm" variant="ghost" onClick={() => window.confirm("Delete this image record?") && deleteMedia.mutate(image.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </article>
            ))}
            {!mediaQuery.isLoading && images.length === 0 && <p className="col-span-full py-6 text-center text-sm text-muted-foreground">No uploaded images yet.</p>}
          </div>
        </section>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader><DialogTitle>{editing ? "Edit library content" : "Create library content"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="flex h-auto flex-wrap justify-start">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="selling">Selling</TabsTrigger>
              <TabsTrigger value="publishing">Publishing</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="visibility">Visibility</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(event) => { update("title", event.target.value); if (!editing) update("slug", slugify(event.target.value)); }} /></label>
              <label className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(event) => update("slug", slugify(event.target.value))} /></label>
              <label className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={(value) => update("type", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{contentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
              <label className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(event) => update("category", event.target.value)} /></label>
              <label className="space-y-2"><Label>Subcategory</Label><Input value={form.subcategory} onChange={(event) => update("subcategory", event.target.value)} /></label>
              <label className="space-y-2"><Label>Author</Label><Input value={form.author} onChange={(event) => update("author", event.target.value)} /></label>
              <label className="space-y-2"><Label>Reviewer</Label><Input value={form.reviewer} onChange={(event) => update("reviewer", event.target.value)} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Summary / Excerpt</Label><Textarea rows={3} value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Content Body</Label><Textarea rows={10} value={form.body} onChange={(event) => update("body", event.target.value)} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Tags</Label><Input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="contracts, research, procurement" /></label>
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <label className="space-y-2"><Label>Bulk upload files</Label><Input type="file" accept=".pdf,.doc,.docx,.mp3,.m4a,.wav,.mp4,.webm,image/*" multiple onChange={(event) => setUploadFiles(event.target.files)} /><span className="block text-xs text-muted-foreground">For podcasts, upload the episode audio plus Word and PDF transcripts, then attach them to the podcast resource.</span></label>
                <label className="space-y-2"><Label>Media category</Label><Input value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} placeholder="reports" /></label>
              </div>
              <Button variant="outline" disabled={!uploadFiles?.length || upload.isPending} onClick={() => upload.mutate()}><Upload className="h-4 w-4" /> Upload selected files</Button>
              {upload.error && <p className="text-sm text-destructive">{upload.error.message}</p>}
              <label className="space-y-2 block"><Label>Featured image URL</Label><Input value={form.featured_image} onChange={(event) => update("featured_image", event.target.value)} /></label>
              <section className="rounded-lg border border-border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-heading text-sm font-semibold">Image Library</h3>
                    <p className="text-xs text-muted-foreground">Select existing images for this content.</p>
                  </div>
                  <Input className="max-w-[220px]" value={imageSearch} onChange={(event) => setImageSearch(event.target.value)} placeholder="Search images" />
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {images.slice(0, 12).map((image) => {
                    const asset = assetFromImage(image);
                    return (
                      <article key={image.id} className="overflow-hidden rounded-lg border border-border">
                        <img src={image.url} alt="" className="aspect-video w-full object-cover" />
                        <div className="space-y-2 p-3">
                          <p className="truncate text-sm font-medium">{image.original_name}</p>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" onClick={() => update("featured_image", image.url)}>Feature</Button>
                            <Button size="sm" variant="outline" onClick={() => update("gallery", [...form.gallery, asset])}>Gallery</Button>
                            <Button size="sm" variant="outline" onClick={() => update("attachments", [...form.attachments, asset])}>Attach</Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                  {!mediaQuery.isLoading && images.length === 0 && <p className="col-span-full text-sm text-muted-foreground">No images available. Upload images from the Image Management panel.</p>}
                </div>
              </section>
              {form.gallery.length > 0 && (
                <section className="rounded-lg border border-border p-4">
                  <h3 className="font-heading text-sm font-semibold">Gallery images</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    {form.gallery.map((image, index) => (
                      <article key={`${image.url}-${index}`} className="overflow-hidden rounded-lg border border-border">
                        <img src={image.url} alt="" className="aspect-video w-full object-cover" />
                        <div className="flex items-center justify-between gap-2 p-2">
                          <p className="truncate text-xs">{image.name}</p>
                          <Button size="sm" variant="ghost" onClick={() => update("gallery", form.gallery.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              <div className="grid gap-3 md:grid-cols-3">
                {form.attachments.map((file, index) => (
                  <section key={`${file.url}-${index}`} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-2">
                      {file.mimeType?.startsWith("image/") ? <Image className="mt-0.5 h-4 w-4" /> : <FileUp className="mt-0.5 h-4 w-4" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{file.url}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => update("featured_image", file.url)}>Feature</Button>
                      <Button size="sm" variant="outline" onClick={() => update("gallery", [...form.gallery, file])}>Gallery</Button>
                      <Button size="sm" variant="ghost" onClick={() => update("attachments", form.attachments.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="selling" className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-lg border border-border p-4 md:col-span-2">
                <span>
                  <span className="block text-sm font-medium">Sell this as a book</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Paid books require purchase before members can download attachments.</span>
                </span>
                <Switch checked={form.sale_enabled} onCheckedChange={(checked) => update("sale_enabled", checked)} />
              </label>
              <label className="space-y-2"><Label>Price</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update("price", Number(event.target.value))} /></label>
              <label className="space-y-2"><Label>Currency</Label><Input value={form.currency} maxLength={3} onChange={(event) => update("currency", event.target.value.toUpperCase())} /></label>
              <label className="space-y-2"><Label>ISBN</Label><Input value={form.isbn} onChange={(event) => update("isbn", event.target.value)} /></label>
              <label className="space-y-2"><Label>Format</Label><Select value={form.book_format} onValueChange={(value) => update("book_format", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Digital">Digital</SelectItem><SelectItem value="Paperback">Paperback</SelectItem><SelectItem value="Hardcover">Hardcover</SelectItem><SelectItem value="Bundle">Bundle</SelectItem></SelectContent></Select></label>
              <label className="space-y-2"><Label>Page count</Label><Input type="number" min="0" value={form.page_count} onChange={(event) => update("page_count", Number(event.target.value))} /></label>
            </TabsContent>

            <TabsContent value="publishing" className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value) => update("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label>
              <label className="space-y-2"><Label>Display priority</Label><Input type="number" value={form.display_priority} onChange={(event) => update("display_priority", Number(event.target.value))} /></label>
              <label className="space-y-2"><Label>Published date & time</Label><Input type="datetime-local" value={form.published_at} onChange={(event) => update("published_at", event.target.value)} /></label>
              <label className="space-y-2"><Label>Scheduled date & time</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(event) => update("scheduled_at", event.target.value)} /></label>
              <label className="space-y-2"><Label>Expiry date & time</Label><Input type="datetime-local" value={form.expires_at} onChange={(event) => update("expires_at", event.target.value)} /></label>
              <section className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Role permissions</p>
                <p className="mt-1 text-xs text-muted-foreground">Backend publishing is enforced for Admin and Super Admin in the current account model. Editor, Author, and Reviewer workflow labels are available through author/reviewer assignment.</p>
              </section>
            </TabsContent>

            <TabsContent value="seo" className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2"><Label>Meta title</Label><Input value={form.seo.title ?? ""} onChange={(event) => update("seo", { ...form.seo, title: event.target.value })} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Meta description</Label><Textarea rows={3} value={form.seo.description ?? ""} onChange={(event) => update("seo", { ...form.seo, description: event.target.value })} /></label>
              <label className="space-y-2 md:col-span-2"><Label>Keywords</Label><Input value={form.seo.keywords ?? ""} onChange={(event) => update("seo", { ...form.seo, keywords: event.target.value })} /></label>
              {Object.keys(defaultFlags).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm capitalize">{key}</span>
                  <Switch checked={Boolean(form.flags[key])} onCheckedChange={(checked) => update("flags", { ...form.flags, [key]: checked })} />
                </label>
              ))}
            </TabsContent>

            <TabsContent value="visibility" className="grid gap-3 md:grid-cols-2">
              {Object.keys(defaultVisibility).map((key) => (
                <label key={key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
                  <Switch checked={Boolean(form.visibility[key])} onCheckedChange={(checked) => update("visibility", { ...form.visibility, [key]: checked })} />
                </label>
              ))}
            </TabsContent>
          </Tabs>
          {save.error && <p className="text-sm text-destructive">{save.error.message}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving" : "Save content"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminLibraryManagement;
