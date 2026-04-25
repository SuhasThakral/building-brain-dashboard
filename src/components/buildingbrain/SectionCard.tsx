import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { GitCompare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionKey } from "@/data/mockData";

type BadgeColor = "grey" | "blue" | "red" | "orange" | "yellow";

interface SectionCardProps {
  sectionKey: SectionKey;
  title: string;
  badge: BadgeColor;
  content: string;
  previousContent: string;
  flashAt?: number;
}

const BADGE_CLASSES: Record<BadgeColor, string> = {
  grey: "bg-badge-grey/15 text-badge-grey border-badge-grey/30",
  blue: "bg-badge-blue/15 text-badge-blue border-badge-blue/30",
  red: "bg-badge-red/15 text-badge-red border-badge-red/40",
  orange: "bg-badge-orange/15 text-badge-orange border-badge-orange/40",
  yellow: "bg-badge-yellow/15 text-badge-yellow border-badge-yellow/40",
};

function formatRelative(ms: number, now: number): string {
  const diff = Math.max(0, Math.floor((now - ms) / 1000));
  if (diff < 5) return "Updated just now";
  if (diff < 60) return `Updated ${diff}s ago`;
  if (diff < 3600) return `Updated ${Math.floor(diff / 60)}m ago`;
  return `Updated ${Math.floor(diff / 3600)}h ago`;
}

interface DiffLine {
  type: "add" | "del" | "ctx";
  text: string;
}

function buildDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);
  const result: DiffLine[] = [];
  // Walk old lines: keep or mark deleted
  for (const line of oldLines) {
    if (newSet.has(line)) result.push({ type: "ctx", text: line });
    else result.push({ type: "del", text: line });
  }
  // Append any new lines not in old
  for (const line of newLines) {
    if (!oldSet.has(line)) result.push({ type: "add", text: line });
  }
  return result;
}

export function SectionCard({
  title,
  badge,
  content,
  previousContent,
  flashAt,
}: SectionCardProps) {
  const [showDiff, setShowDiff] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [flashKey, setFlashKey] = useState(0);

  // Re-trigger flash animation by remounting via key
  useEffect(() => {
    if (flashAt) setFlashKey((k) => k + 1);
  }, [flashAt]);

  // Tick the relative timestamp
  useEffect(() => {
    if (!flashAt) return;
    setNow(Date.now());
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [flashAt]);

  const showUpdated = flashAt && now - flashAt < 30_000;
  const hasChanges = content !== previousContent;

  const diff = useMemo(
    () => (showDiff ? buildDiff(previousContent, content) : []),
    [showDiff, previousContent, content],
  );

  return (
    <div
      key={flashKey}
      className={cn(
        "rounded-lg border border-border bg-card/60 transition-colors",
        flashAt && "bb-flash",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              BADGE_CLASSES[badge],
            )}
          >
            {title}
          </span>
          {showUpdated && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald/40 bg-emerald/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              {formatRelative(flashAt!, now)}
            </span>
          )}
        </div>
        {hasChanges && (
          <button
            onClick={() => setShowDiff((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
              showDiff
                ? "border-emerald/40 bg-emerald/10 text-emerald"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {showDiff ? (
              <>
                <X className="h-3 w-3" /> Hide diff
              </>
            ) : (
              <>
                <GitCompare className="h-3 w-3" /> Show diff
              </>
            )}
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {showDiff ? (
          <div className="overflow-x-auto">
            {diff.map((line, i) => (
              <span
                key={i}
                className={
                  line.type === "add"
                    ? "bb-diff-add"
                    : line.type === "del"
                      ? "bb-diff-del"
                      : "bb-diff-ctx"
                }
              >
                {line.text || "\u00A0"}
              </span>
            ))}
          </div>
        ) : (
          <div className="bb-md overflow-x-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
