import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Eye, EyeOff } from "lucide-react";

interface ProtectedViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  watermark?: string;
  content: string | string[];
  subtitle?: string;
}

/**
 * View-only protected document viewer.
 * Best-effort deterrents: blocks right-click, text selection, copy, print,
 * adds a tiled watermark, and blurs content when the tab/window loses focus.
 * Note: browsers cannot truly prevent screenshots.
 */
const ProtectedViewer = ({ open, onOpenChange, title, watermark = "CONFIDENTIAL · PCMO", content, subtitle }: ProtectedViewerProps) => {
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);
    const onVisibility = () => setBlurred(document.visibilityState !== "visible");
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (k === "p" || k === "s" || k === "c" || k === "u")) {
        e.preventDefault();
      }
      if (k === "printscreen") e.preventDefault();
    };
    const beforePrint = () => setBlurred(true);
    const afterPrint = () => setBlurred(false);

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("keydown", blockKeys);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    // Inject @media print override while viewer is open
    const style = document.createElement("style");
    style.id = "protected-viewer-print-block";
    style.innerHTML = `@media print { body * { visibility: hidden !important; } body::after { content: "Printing is disabled for protected content."; visibility: visible; display: block; padding: 2rem; font-family: sans-serif; } }`;
    document.head.appendChild(style);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("keydown", blockKeys);
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
      document.getElementById("protected-viewer-print-block")?.remove();
    };
  }, [open]);

  const paragraphs = Array.isArray(content) ? content : content.split(/\n{2,}/);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs">
            <Eye className="w-3 h-3" /> View-only · Download, print and copy are disabled · Content blurs when tab loses focus
            {subtitle ? <span className="ml-2 opacity-70">· {subtitle}</span> : null}
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative flex-1 overflow-y-auto rounded-lg border border-border bg-card"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Tiled watermark overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 opacity-[0.08]"
            style={{
              backgroundImage: `repeating-linear-gradient(-30deg, transparent 0 120px, transparent 120px 240px)`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `repeating-linear-gradient(-30deg, transparent 0, transparent 80px, hsl(var(--foreground)/0.0) 80px, hsl(var(--foreground)/0.0) 160px)`,
              }}
            />
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <pattern id="wm" width="320" height="180" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
                  <text x="0" y="90" fill="hsl(var(--foreground))" fontSize="18" fontWeight="700" fontFamily="sans-serif">
                    {watermark}
                  </text>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#wm)" />
            </svg>
          </div>

          {/* Blur overlay when tab loses focus */}
          {blurred && (
            <div className="absolute inset-0 z-20 backdrop-blur-xl bg-background/70 flex flex-col items-center justify-center gap-2 text-center px-6">
              <EyeOff className="w-8 h-8 text-muted-foreground" />
              <p className="font-heading font-semibold text-foreground">Content hidden</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Protected material is concealed while this window isn't in focus. Return to this tab to continue viewing.
              </p>
            </div>
          )}

          <article className="relative z-0 p-6 space-y-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-sm leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
          </article>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3" /> Protected viewer · © PCMO
          </span>
          <span>Screen-capture deterrents active</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProtectedViewer;
