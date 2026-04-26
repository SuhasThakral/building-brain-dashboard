import { useCallback, useEffect, useRef, useState } from "react";
import {
  DAY0_SECTIONS,
  SIMULATION_DAYS,
  type Event,
  type SectionKey,
} from "@/data/mockData";

export interface FeedEvent extends Event {
  arrivedAt: number; // epoch ms when added to feed
  // Optional smart-patch annotations (for events ingested by Gemini)
  smartAction?: "append" | "update" | "resolve" | "flag_conflict" | "ignore";
  reason?: string;
}

export interface Stats {
  eventsProcessed: number;
  sectionsUpdated: number;
  noiseFiltered: number;
  conflicts: number;
  resolved: number;
}

export interface SectionFlash {
  // Map of section key -> timestamp (ms) when it was last updated
  [key: string]: number;
}

const initialSections = (): Record<SectionKey, string> => ({ ...DAY0_SECTIONS });
const initialStats = (): Stats => ({
  eventsProcessed: 0,
  sectionsUpdated: 0,
  noiseFiltered: 0,
  conflicts: 0,
  resolved: 0,
});

const PLACEHOLDERS = [
  "*No open issues recorded.*",
  "*No active legal disputes.*",
  "*No pending owner actions.*",
  "*No financial alerts.*",
];

function appendToSection(current: string, line: string): string {
  let next = current;
  for (const ph of PLACEHOLDERS) {
    next = next.replace(ph, "");
  }
  next = next.trim();
  return next ? `${next}\n${line}` : line;
}

export function useSimulation() {
  const [sections, setSections] = useState<Record<SectionKey, string>>(
    initialSections,
  );
  // Snapshot of the section content at the moment the user toggles "Show diff"
  // not needed — we keep a baseline of the original Day 0 plus prior content for diffing.
  const [prevSections, setPrevSections] = useState<Record<SectionKey, string>>(
    initialSections,
  );
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [flash, setFlash] = useState<SectionFlash>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingDay, setPlayingDay] = useState<number | null>(null);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setSections(initialSections());
    setPrevSections(initialSections());
    setFeed([]);
    setStats(initialStats());
    setFlash({});
    setIsPlaying(false);
    setPlayingDay(null);
  }, [clearTimers]);

  const ingestEvent = useCallback((evt: Event) => {
    const arrived: FeedEvent = { ...evt, arrivedAt: Date.now() };
    setFeed((f) => [arrived, ...f]);
    setStats((s) => ({
      ...s,
      eventsProcessed: s.eventsProcessed + 1,
      sectionsUpdated:
        evt.isSignal && evt.targetSection
          ? s.sectionsUpdated + 1
          : s.sectionsUpdated,
      noiseFiltered: evt.isSignal ? s.noiseFiltered : s.noiseFiltered + 1,
    }));

    if (evt.isSignal && evt.targetSection && evt.appendLine) {
      const target = evt.targetSection;
      setSections((prev) => {
        // Capture previous version BEFORE patching, for diff baseline
        setPrevSections((pSnap) => ({ ...pSnap, [target]: prev[target] }));
        return {
          ...prev,
          [target]: appendToSection(prev[target], evt.appendLine!),
        };
      });
      setFlash((f) => ({ ...f, [target]: Date.now() }));
    }
  }, []);

  const playDay = useCallback(
    (day: number) => {
      if (isPlaying) return;
      const dayData = SIMULATION_DAYS[day];
      if (!dayData) return;
      setIsPlaying(true);
      setPlayingDay(day);

      dayData.events.forEach((evt, idx) => {
        const t = setTimeout(() => {
          ingestEvent(evt);
          if (idx === dayData.events.length - 1) {
            setIsPlaying(false);
          }
        }, idx * 1000);
        timersRef.current.push(t);
      });
    },
    [isPlaying, ingestEvent],
  );

  return {
    sections,
    prevSections,
    feed,
    stats,
    flash,
    isPlaying,
    playingDay,
    playDay,
    reset,
  };
}
