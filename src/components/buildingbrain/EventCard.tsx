import { Mail, FileText, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedEvent } from "@/hooks/useSimulation";
import type { SectionKey } from "@/data/mockData";

const SECTION_LABELS: Record<SectionKey, string> = {
  "property-core": "Property Core",
  accounts: "Bank Accounts",
  owners: "Owners",
  tenants: "Tenants",
  contractors: "Service Providers",
  "open-issues": "Open Issues",
  legal: "Legal Disputes",
  pending: "Pending Owner Actions",
  financials: "Financial Alerts",
};

const ICONS = {
  email: Mail,
  invoice: FileText,
  bank: Landmark,
};

interface EventCardProps {
  event: FeedEvent;
}

export function EventCard({ event }: EventCardProps) {
  const Icon = ICONS[event.type];
  const isNoise = !event.isSignal;
  // Graceful fallback so this component works against future API responses too
  const description =
    (event as unknown as { status?: string }).status ||
    event.appendLine ||
    event.subject;

  return (
    <div
      className={cn(
        "bb-slide-in rounded-lg border bg-card/60 p-3 transition-colors",
        isNoise
          ? "border-border/60 opacity-55"
          : "border-border hover:border-emerald/40",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isNoise
              ? "border-border bg-muted/40 text-muted-foreground"
              : "border-emerald/30 bg-emerald/10 text-emerald",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-xs font-medium text-foreground">
              {event.sender}
            </div>
            <div className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {event.timestamp}
            </div>
          </div>

          <div
            className={cn(
              "mt-0.5 truncate text-xs",
              isNoise ? "text-muted-foreground" : "text-foreground/85",
            )}
            title={event.subject}
          >
            {event.subject}
          </div>

          {!isNoise && event.appendLine && (
            <div
              className="mt-1 truncate font-mono text-[10.5px] text-muted-foreground"
              title={event.appendLine}
            >
              {description}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1.5">
            {isNoise ? (
              <>
                <span className="inline-flex items-center rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  Noise
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  → Ignored (noise)
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-emerald/30 bg-emerald/10 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald">
                → {event.targetSection ? SECTION_LABELS[event.targetSection] : "Update"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
