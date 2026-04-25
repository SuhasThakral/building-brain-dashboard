import { Activity, Filter, Layers } from "lucide-react";
import { EventCard } from "./EventCard";
import type { FeedEvent, Stats } from "@/hooks/useSimulation";

interface EventFeedProps {
  feed: FeedEvent[];
  stats: Stats;
}

interface StatTileProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatTile({ label, value, icon, accent }: StatTileProps) {
  return (
    <div
      className={
        "rounded-lg border border-border bg-card/60 p-3 " +
        (accent ? "border-emerald/30" : "")
      }
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={
          "mt-1 font-mono text-2xl font-semibold tabular-nums " +
          (accent ? "text-emerald" : "text-foreground")
        }
      >
        {value}
      </div>
    </div>
  );
}

export function EventFeed({ feed, stats }: EventFeedProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />
        <span>Event Feed</span>
        <span className="text-border">/</span>
        <span>{feed.length} total</span>
      </div>

      <div className="grid grid-cols-3 gap-2 p-4 pb-3">
        <StatTile
          label="Processed"
          value={stats.eventsProcessed}
          icon={<Activity className="h-3 w-3" />}
        />
        <StatTile
          label="Updated"
          value={stats.sectionsUpdated}
          accent
          icon={<Layers className="h-3 w-3" />}
        />
        <StatTile
          label="Noise filtered"
          value={stats.noiseFiltered}
          icon={<Filter className="h-3 w-3" />}
        />
      </div>

      <div className="bb-scroll flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        {feed.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 p-8 text-center">
            <div className="text-xs text-muted-foreground">
              No events yet. Pick a day and press{" "}
              <span className="font-mono text-emerald">Play</span> to start the
              simulation.
            </div>
          </div>
        ) : (
          feed.map((evt) => <EventCard key={evt.id + evt.arrivedAt} event={evt} />)
        )}
      </div>
    </div>
  );
}
