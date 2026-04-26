import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FraudAlert } from "@/hooks/useSimulation";

interface FraudAlertsProps {
  alerts: FraudAlert[];
  onDismiss: (id: string) => void;
}

export function FraudAlerts({ alerts, onDismiss }: FraudAlertsProps) {
  const active = alerts.filter((a) => !a.dismissed);
  if (active.length === 0) return null;

  return (
    <div className="bb-bg-fraud border-b-2 border-destructive/60 px-6 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-destructive">
        <ShieldAlert className="h-4 w-4 animate-pulse" />
        Fraud Detected · {active.length} payment{active.length > 1 ? "s" : ""} blocked
      </div>
      <div className="space-y-2">
        {active.map((alert) => {
          const d = alert.details;
          return (
            <div
              key={alert.id}
              className="flex items-start gap-3 rounded-md border border-destructive/50 bg-background/60 p-3"
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-destructive/60 bg-destructive/20 text-destructive">
                <ShieldAlert className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-foreground">
                    {d.vendor} — claimed new bank details
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    via {alert.sender.split("<")[0].trim()}
                  </div>
                </div>
                <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono text-[10.5px]">
                  <span className="text-emerald">✓ Stammdaten</span>
                  <span className="text-foreground/90">
                    {d.realIban} · {d.realBic}
                  </span>
                  <span className="text-destructive">✗ Email claim</span>
                  <span className="text-destructive">
                    {d.claimedIban} · {d.claimedBic}
                  </span>
                </div>
                <div className="mt-1.5 text-[10.5px] text-destructive/90">
                  Payment auto-blocked · context file untouched · awaiting human verification
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => onDismiss(alert.id)}
                aria-label="Dismiss alert"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
