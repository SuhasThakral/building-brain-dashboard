import { useState } from "react";
import { Play, RotateCcw, Building2, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VoiceState } from "@/hooks/useVoiceQuery";

interface TopBarProps {
  onPlayDay: (day: number) => void;
  onReset: () => void;
  onOpenIngest: () => void;
  isPlaying: boolean;
  playingDay: number | null;
  onVoiceStart: () => void;
  onVoiceStop: () => void;
  voiceState: VoiceState;
  voiceSupported: boolean;
}

export function TopBar({
  onPlayDay,
  onReset,
  onOpenIngest,
  isPlaying,
  playingDay,
  onVoiceStart,
  onVoiceStop,
  voiceState,
  voiceSupported,
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
              className="h-7 gap-1.5 bg-gradient-to-r from-emerald to-emerald/70 px-3 text-xs font-semibold text-primary-foreground shadow-[0_0_16px_-4px_var(--emerald-glow)] hover:opacity-90"
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

          <button
            type="button"
            onMouseDown={onVoiceStart}
            onMouseUp={onVoiceStop}
            onMouseLeave={() => voiceState === "recording" && onVoiceStop()}
            onTouchStart={(e) => {
              e.preventDefault();
              onVoiceStart();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onVoiceStop();
            }}
            disabled={!voiceSupported || voiceState === "thinking"}
            title={
              voiceSupported
                ? "Hold to ask the building"
                : "Voice not supported — use Chrome"
            }
            className={cn(
              "flex h-9 select-none items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-all disabled:opacity-50",
              voiceState === "recording" &&
                "animate-pulse border-red-500/60 bg-red-500/20 text-red-300 shadow-[0_0_16px_-4px_rgba(248,113,113,0.6)]",
              voiceState === "thinking" &&
                "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
              voiceState === "answering" &&
                "border-emerald/50 bg-emerald/15 text-emerald",
              (voiceState === "idle" || voiceState === "error") &&
                "border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20",
            )}
          >
            <Mic className="h-3.5 w-3.5" />
            {voiceState === "recording"
              ? "Listening…"
              : voiceState === "thinking"
                ? "Thinking…"
                : voiceState === "answering"
                  ? "Speaking"
                  : "Ask"}
          </button>

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
