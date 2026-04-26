import { Mail, FileText, Landmark, ShieldAlert, Filter, Sparkles } from "lucide-react";
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

  // ─── FRAUD CARD ──────────────────────────────────────────
  if (event.isFraud && event.fraudDetails) {
    const d = event.fraudDetails;
    return (
      <div className="bb-slide-in rounded-lg border-2 border-destructive/70 bg-destructive/10 p-3 shadow-[0_0_0_1px_hsl(var(--destructive)/0.2)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-destructive/60 bg-destructive/20 text-destructive">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-xs font-semibold text-destructive">
                {event.sender}
              </div>
              <div className="shrink-0 font-mono text-[10px] text-destructive/80">
                {event.timestamp}
              </div>
            </div>

            <div className="mt-0.5 truncate text-xs text-foreground" title={event.subject}>
              {event.subject}
            </div>

            <div className="mt-2 rounded border border-destructive/40 bg-background/40 p-2 text-[10.5px] font-mono">
              <div className="mb-1 flex items-center gap-1 text-destructive font-semibold tracking-wide uppercase text-[9.5px]">
                <ShieldAlert className="h-3 w-3" /> IBAN Mismatch — Stammdaten Cross-Check
              </div>
              <div className="text-[10.5px] text-foreground/80">
                Vendor: <span className="font-semibold">{d.vendor}</span>
              </div>
              <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                <span className="text-emerald">✓ Real</span>
                <span className="truncate text-foreground/90" title={d.realIban}>
                  {d.realIban} <span className="text-muted-foreground">/ {d.realBic}</span>
                </span>
                <span className="text-destructive">✗ Claimed</span>
                <span className="truncate text-destructive" title={d.claimedIban}>
                  {d.claimedIban} <span className="text-destructive/80">/ {d.claimedBic}</span>
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded border border-destructive/60 bg-destructive/20 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-destructive">
                🚨 Fraud Blocked
              </span>
              <span className="text-[10.5px] text-destructive/90">
                Payment prevented · human approval required
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REGULAR / NOISE CARD ────────────────────────────────
  const isNoise = !event.isSignal;
  const description =
    (event as unknown as { status?: string }).status ||
    event.appendLine ||
    event.subject;

  const noiseStageLabel =
    event.noiseStage === "rule"
      ? "Rule Filter"
      : event.noiseStage === "ai"
        ? "AI Filter"
        : "Noise";
  const NoiseIcon = event.noiseStage === "ai" ? Sparkles : Filter;

  return (
    <div
      className={cn(
        "bb-slide-in rounded-lg border bg-card/60 p-3 transition-colors",
        isNoise
          ? "border-border/60 opacity-60"
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

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {isNoise ? (
              <>
                <span className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-muted-foreground">
                  <NoiseIcon className="h-2.5 w-2.5" />
                  {noiseStageLabel}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  → Filtered, no context update
                </span>
              </>
            ) : (
              <>
                {event.smartAction && event.smartAction !== "append" && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider",
                      event.smartAction === "resolve" &&
                        "border-emerald/40 bg-emerald/10 text-emerald",
                      event.smartAction === "update" &&
                        "border-badge-blue/40 bg-badge-blue/10 text-badge-blue",
                      event.smartAction === "flag_conflict" &&
                        "border-badge-orange/40 bg-badge-orange/10 text-badge-orange",
                    )}
                  >
                    {event.smartAction === "flag_conflict"
                      ? "⚡ Conflict"
                      : event.smartAction}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded border border-emerald/30 bg-emerald/10 px-1.5 py-0.5 text-[10.5px] font-medium text-emerald">
                  → {event.targetSection ? SECTION_LABELS[event.targetSection] : "Update"}
                </span>
              </>
            )}
          </div>

          {(event.reason || (isNoise && event.noiseReason)) && (
            <div className="mt-1 text-[10px] italic text-muted-foreground/80">
              {event.reason || event.noiseReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
