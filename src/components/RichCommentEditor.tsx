import { useRef, useState } from "react";
import { Bold, Code2, Eye, Heading2, Italic, Link2, List, ListOrdered, MessageSquareQuote, Pencil, Strikethrough } from "lucide-react";
import { Button } from "@/components/ui/button";

const inline = (text: string) => {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;
  return text.split(pattern).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith("~~")) return <s key={index}>{part.slice(2, -2)}</s>;
    if (part.startsWith("`")) return <code key={index} className="rounded bg-muted px-1.5 py-0.5 text-xs">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="font-medium text-primary underline">{link[1]}</a>;
    return <span key={index}>{part}</span>;
  });
};

export const RichTextPreview = ({ value, compact = false }: { value: string; compact?: boolean }) => {
  const lines = value.split("\n");
  return <div className={`rich-comment text-sm text-foreground/85 ${compact ? "line-clamp-3" : "space-y-2"}`}>{lines.map((line, index) => {
    if (!line.trim()) return <div key={index} className="h-2" />;
    if (line.startsWith("### ")) return <h4 key={index} className="text-base font-bold">{inline(line.slice(4))}</h4>;
    if (line.startsWith("## ")) return <h3 key={index} className="text-lg font-bold">{inline(line.slice(3))}</h3>;
    if (line.startsWith("> ")) return <blockquote key={index} className="border-l-4 border-primary/30 bg-muted/50 px-4 py-2 italic">{inline(line.slice(2))}</blockquote>;
    if (/^[-*] /.test(line)) return <div key={index} className="flex gap-2 pl-2"><span className="text-primary">•</span><span>{inline(line.slice(2))}</span></div>;
    if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.*)$/)!;
      return <div key={index} className="flex gap-2 pl-2"><span className="font-bold text-primary">{match[1]}.</span><span>{inline(match[2])}</span></div>;
    }
    if (line.startsWith("```")) return null;
    return <p key={index} className="whitespace-pre-wrap leading-7">{inline(line)}</p>;
  })}</div>;
};

const RichCommentEditor = ({ value, onChange, placeholder = "Write a thoughtful reply…", minHeight = "220px" }: { value: string; onChange: (value: string) => void; placeholder?: string; minHeight?: string }) => {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after = before, sample = "text") => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || sample;
    onChange(value.slice(0, start) + before + selected + after + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const prefixLines = (kind: "bullet" | "number" | "plain", mark = "") => {
    const el = ref.current;
    if (!el) return;
    const lineStart = value.lastIndexOf("\n", Math.max(0, el.selectionStart - 1)) + 1;
    const nextBreak = value.indexOf("\n", el.selectionEnd);
    const lineEnd = nextBreak === -1 ? value.length : nextBreak;
    const formatted = value.slice(lineStart, lineEnd).split("\n").map((line, index) => {
      const clean = line.replace(/^\s*(?:[-*]\s+|\d+\.\s+|>\s+|#{1,3}\s+)/, "");
      if (kind === "bullet") return `- ${clean}`;
      if (kind === "number") return `${index + 1}. ${clean}`;
      return `${mark}${clean}`;
    }).join("\n");
    onChange(value.slice(0, lineStart) + formatted + value.slice(lineEnd));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + formatted.length);
    });
  };

  const tools = [
    [Bold, "Bold", () => wrap("**")],
    [Italic, "Italic", () => wrap("*")],
    [Strikethrough, "Strike", () => wrap("~~")],
    [Heading2, "Heading", () => prefixLines("plain", "## ")],
    [List, "Bullet list", () => prefixLines("bullet")],
    [ListOrdered, "Numbered list", () => prefixLines("number")],
    [MessageSquareQuote, "Quote", () => prefixLines("plain", "> ")],
    [Code2, "Inline code", () => wrap("`")],
    [Link2, "Link", () => wrap("[", "](https://example.com)", "link text")],
  ] as const;

  return <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 p-2">
      <div className="flex flex-wrap gap-1">{tools.map(([Icon, label, action]) => <button key={label} type="button" onClick={action} title={label} aria-label={label} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-background hover:text-foreground"><Icon className="h-4 w-4" /></button>)}</div>
      <div className="flex rounded-lg border bg-background p-0.5">
        <Button type="button" size="sm" variant={!preview ? "secondary" : "ghost"} onClick={() => setPreview(false)}><Pencil className="mr-1 h-3.5 w-3.5" />Write</Button>
        <Button type="button" size="sm" variant={preview ? "secondary" : "ghost"} onClick={() => setPreview(true)}><Eye className="mr-1 h-3.5 w-3.5" />Preview</Button>
      </div>
    </div>
    {preview ? <div style={{ minHeight }} className="p-5">{value.trim() ? <RichTextPreview value={value} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}</div> : <textarea ref={ref} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={5000} style={{ minHeight }} className="w-full resize-y bg-transparent p-5 text-sm leading-7 outline-none" />}
    <div className="flex justify-between border-t bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground"><span>Markdown supported · select multiple lines to format a list</span><span>{value.length}/5000</span></div>
  </div>;
};

export default RichCommentEditor;
