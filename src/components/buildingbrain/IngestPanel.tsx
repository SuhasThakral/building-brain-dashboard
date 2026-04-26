import { useRef, useState } from "react";
import { Upload, FileUp, Type, Loader2, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { IngestedEvent } from "@/hooks/useSmartIngest";

interface IngestPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  progress: string | null;
  error: string | null;
  history: IngestedEvent[];
  onIngestText: (text: string, sourceLabel?: string) => Promise<unknown>;
  onIngestPdf: (file: File) => Promise<unknown>;
}

export function IngestPanel({
  open,
  onOpenChange,
  busy,
  progress,
  error,
  history,
  onIngestText,
  onIngestPdf,
}: IngestPanelProps) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[480px] overflow-y-auto border-l border-border bg-background sm:max-w-none"
      >
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Upload className="h-4 w-4 text-emerald" />
            Smart Ingest
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Drop a PDF invoice or paste an email. Gemini extracts the facts and
            the brain decides whether to append, update, resolve, or flag a
            conflict.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="pdf" className="mt-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf" className="gap-1.5 text-xs">
              <FileUp className="h-3.5 w-3.5" /> PDF
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5 text-xs">
              <Type className="h-3.5 w-3.5" /> Email / Text
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-3 space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className={cn(
                "flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/40 text-sm text-muted-foreground transition-colors",
                "hover:border-emerald/50 hover:bg-emerald/5 hover:text-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <FileUp className="h-6 w-6" />
              <span>Click to upload an invoice / letter PDF</span>
              <span className="text-[10px] text-muted-foreground/70">
                Max ~6 MB · Gemini reads it natively
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onIngestPdf(file);
                  e.target.value = "";
                }
              }}
            />
          </TabsContent>

          <TabsContent value="text" className="mt-3 space-y-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste an email, a complaint, a tenant message — German or English…"
              rows={8}
              disabled={busy}
              className="resize-none text-xs"
            />
            <Button
              size="sm"
              disabled={busy || !text.trim()}
              onClick={async () => {
                await onIngestText(text, "Pasted message");
                setText("");
              }}
              className="w-full bg-emerald text-primary-foreground hover:bg-emerald/90"
            >
              Send to brain
            </Button>
          </TabsContent>
        </Tabs>

        {progress && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald/30 bg-emerald/10 px-3 py-2 text-xs text-emerald">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {progress}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Recent ingestions</span>
              <span>{history.length}</span>
            </div>
            <div className="space-y-2">
              {history.slice(0, 12).map((h) => (
                <div
                  key={h.id}
                  className="rounded-md border border-border bg-card/50 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-foreground">
                      {h.source}
                    </span>
                    <ActionBadge action={h.action} />
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                    {h.summary}
                  </div>
                  {h.newLine && (
                    <div className="mt-1.5 truncate font-mono text-[10px] text-emerald/90">
                      → {h.newLine}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActionBadge({ action }: { action: IngestedEvent["action"] }) {
  const styles: Record<IngestedEvent["action"], string> = {
    append: "border-emerald/30 bg-emerald/10 text-emerald",
    update: "border-badge-blue/40 bg-badge-blue/10 text-badge-blue",
    resolve: "border-emerald/40 bg-emerald/15 text-emerald",
    flag_conflict: "border-badge-orange/40 bg-badge-orange/10 text-badge-orange",
    ignore: "border-border bg-muted/30 text-muted-foreground",
  };
  const label =
    action === "flag_conflict" ? "⚡ conflict" : action;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
        styles[action],
      )}
    >
      {label}
    </span>
  );
}
