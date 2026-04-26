import { useState } from "react";
import { Play, RotateCcw, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopBarProps {
  onPlayDay: (day: number) => void;
  onReset: () => void;
  onOpenIngest: () => void;
  isPlaying: boolean;
  playingDay: number | null;
}

export function TopBar({
  onPlayDay,
  onReset,
  onOpenIngest,
  isPlaying,
  playingDay,
}: TopBarProps) {
  const [selectedDay, setSelectedDay] = useState<string>("1");

  return (
    <header className="bb-bg-topbar border-b border-border backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-4 px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bb-glow-emerald flex h-9 w-9 items-center justify-center rounded-md border border-emerald/30 bg-gradient-to-br from-emerald/30 to-emerald/5 text-emerald">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              BuildingBrain
            </div>
            <h1 className="truncate text-sm font-semibold leading-tight">
              <span className="bb-text-gradient">WEG Immanuelkirchstraße 26</span>
              <span className="text-foreground/80">, Berlin</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1">
          <span className="bb-pulse h-2 w-2 rounded-full bg-emerald" />
          <span className="text-xs font-medium uppercase tracking-wider text-emerald">
            Live
          </span>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card/60 px-2 py-1">
            <span className="px-1 text-xs uppercase tracking-wider text-muted-foreground">
              Run
            </span>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="h-7 w-[110px] border-0 bg-transparent px-2 text-xs focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)} className="text-xs">
                    Day {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => onPlayDay(Number(selectedDay))}
              disabled={isPlaying}
              className="h-7 gap-1.5 bg-emerald px-3 text-xs font-semibold text-primary-foreground hover:bg-emerald/90"
            >
              <Play className="h-3 w-3 fill-current" />
              {isPlaying && playingDay === Number(selectedDay)
                ? "Playing…"
                : "Play"}
            </Button>
          </div>

          <Button
            size="sm"
            onClick={onOpenIngest}
            className="h-9 gap-1.5 bg-emerald/15 px-3 text-xs font-semibold text-emerald hover:bg-emerald/25"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ingest
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="h-9 gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>
    </header>
  );
}
