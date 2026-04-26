import { useCallback, useEffect, useRef, useState } from "react";
import {
  DAY0_SECTIONS,
  SIMULATION_DAYS,
  type Event,
  type FraudDetails,
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
  noiseRule: number;
  noiseAi: number;
  fraudBlocked: number;
  conflicts: number;
  resolved: number;
}

export interface SectionFlash {
  // Map of section key -> timestamp (ms) when it was last updated
  [key: string]: number;
}

export interface FraudAlert {
  id: string;
  arrivedAt: number;
  details: FraudDetails;
  sender: string;
  subject: string;
  dismissed: boolean;
}

const initialSections = (): Record<SectionKey, string> => ({ ...DAY0_SECTIONS });
const initialStats = (): Stats => ({
  eventsProcessed: 0,
  sectionsUpdated: 0,
  noiseFiltered: 0,
  noiseRule: 0,
  noiseAi: 0,
  fraudBlocked: 0,
  conflicts: 0,
  resolved: 0,
});

const PLACEHOLDERS = [
  "*No open issues recorded.*",
  "*No active legal disputes.*",
  "*No pending owner actions.*",
  "*No financial alerts.*",
];

function appendToSection(current: string, line: string, sourceId?: string): string {
  let next = current;
  for (const ph of PLACEHOLDERS) {
    next = next.replace(ph, "");
  }
  next = next.trim();
  const block = sourceId ? `${line}\n  \`src: ${sourceId}\`` : line;
  return next ? `${next}\n${block}` : block;
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
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const dismissFraud = useCallback((id: string) => {
    setFraudAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
    );
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setSections(initialSections());
    setPrevSections(initialSections());
    setFeed([]);
    setStats(initialStats());
    setFlash({});
    setFraudAlerts([]);
    setIsPlaying(false);
    setPlayingDay(null);
  }, [clearTimers]);

  const ingestEvent = useCallback((evt: Event) => {
    const arrived: FeedEvent = { ...evt, arrivedAt: Date.now() };
    setFeed((f) => [arrived, ...f]);

    // FRAUD: blocked, never touches context file, raises alert
    if (evt.isFraud && evt.fraudDetails) {
      setFraudAlerts((prev) => [
        {
          id: evt.id,
          arrivedAt: Date.now(),
          details: evt.fraudDetails!,
          sender: evt.sender,
          subject: evt.subject,
          dismissed: false,
        },
        ...prev,
      ]);
      setStats((s) => ({
        ...s,
        eventsProcessed: s.eventsProcessed + 1,
        fraudBlocked: s.fraudBlocked + 1,
      }));
      return;
    }

    setStats((s) => ({
      ...s,
      eventsProcessed: s.eventsProcessed + 1,
      sectionsUpdated:
        evt.isSignal && evt.targetSection
          ? s.sectionsUpdated + 1
          : s.sectionsUpdated,
      noiseFiltered: evt.isSignal ? s.noiseFiltered : s.noiseFiltered + 1,
      noiseRule:
        !evt.isSignal && evt.noiseStage === "rule"
          ? s.noiseRule + 1
          : s.noiseRule,
      noiseAi:
        !evt.isSignal && evt.noiseStage === "ai" ? s.noiseAi + 1 : s.noiseAi,
    }));

    if (evt.isSignal && evt.targetSection && evt.appendLine) {
      const target = evt.targetSection;
      setSections((prev) => {
        // Capture previous version BEFORE patching, for diff baseline
        setPrevSections((pSnap) => ({ ...pSnap, [target]: prev[target] }));
        return {
          ...prev,
          [target]: appendToSection(prev[target], evt.appendLine!, evt.id),
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

  // Keep a ref to the latest sections so async ingestion sees fresh state
  const sectionsRef = useRef(sections);
  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);
  const getSections = useCallback(() => sectionsRef.current, []);

  /**
   * Apply a smart-patch result from Gemini.
   * Handles append / update / resolve / flag_conflict / ignore.
   */
  const applySmartPatch = useCallback(
    (patch: {
      action: "append" | "update" | "resolve" | "flag_conflict" | "ignore";
      targetSection: SectionKey;
      newLine: string | null;
      targetLine: string | null;
      conflictNote: string | null;
      reason: string;
      source: string;
      summary: string;
    }) => {
      // ── SAFETY NET ──────────────────────────────────────────────────────
      // Gemini sometimes returns action="append" with [RESOLVED ...] / ✅ in
      // the newLine instead of action="resolve" with a targetLine pointer.
      // Detect that case here and salvage it into a real resolve.
      let effectiveAction = patch.action;
      let effectiveTargetLine = patch.targetLine;
      if (
        effectiveAction === "append" &&
        patch.newLine &&
        (patch.newLine.includes("[RESOLVED") ||
          patch.newLine.startsWith("- ✅") ||
          patch.newLine.includes(" ✅ "))
      ) {
        const current = sectionsRef.current[patch.targetSection] ?? "";
        const unitMatch = patch.newLine.match(/(WE\s?\d+|HAUS-\d+|TG\s?\d+|GE\s?\d+)/);
        const lines = current.split("\n");
        let candidate: string | undefined;
        if (unitMatch) {
          const unit = unitMatch[0];
          candidate = lines.find(
            (l) =>
              l.includes(unit) &&
              !l.includes("[RESOLVED") &&
              !l.startsWith("  `src:") &&
              l.trim().startsWith("- "),
          );
        }
        if (!candidate) {
          // Fall back to keyword match (heating, roof, etc.)
          const keywords = ["heating", "heizung", "roof", "dach", "elevator", "aufzug", "boiler", "leak", "wasser"];
          const lowered = patch.newLine.toLowerCase();
          const kw = keywords.find((k) => lowered.includes(k));
          if (kw) {
            candidate = lines.find(
              (l) =>
                l.toLowerCase().includes(kw) &&
                !l.includes("[RESOLVED") &&
                !l.startsWith("  `src:") &&
                l.trim().startsWith("- "),
            );
          }
        }
        if (candidate) {
          console.log(
            "[smartPatch safety-net] converting append → resolve, matched:",
            candidate,
          );
          effectiveAction = "resolve";
          effectiveTargetLine = candidate;
        }
      }

      const isSignal = effectiveAction !== "ignore";
      const feedEvt: FeedEvent = {
        id: `SMART-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "email",
        sender: patch.source,
        timestamp: new Date().toISOString(),
        subject: patch.summary.slice(0, 120),
        isSignal,
        targetSection: isSignal ? patch.targetSection : undefined,
        appendLine: patch.newLine ?? undefined,
        arrivedAt: Date.now(),
        smartAction: effectiveAction,
        reason: patch.reason,
      };
      setFeed((f) => [feedEvt, ...f]);

      setStats((s) => ({
        ...s,
        eventsProcessed: s.eventsProcessed + 1,
        sectionsUpdated: isSignal ? s.sectionsUpdated + 1 : s.sectionsUpdated,
        noiseFiltered: isSignal ? s.noiseFiltered : s.noiseFiltered + 1,
        conflicts: effectiveAction === "flag_conflict" ? s.conflicts + 1 : s.conflicts,
        resolved: effectiveAction === "resolve" ? s.resolved + 1 : s.resolved,
      }));

      if (!isSignal || !patch.newLine) return;
      const target = patch.targetSection;
      const sourceId = feedEvt.id;

      // ── RESOLVE: move the line out of its source section into "resolved" ──
      if (effectiveAction === "resolve") {
        setSections((prev) => {
          const sourceContent = prev[target] ?? "";
          const lines = sourceContent.split("\n");

          // Find the line to remove (and its trailing `src:` trace line)
          let lineIndex = -1;
          if (effectiveTargetLine) {
            lineIndex = lines.findIndex((l) => l === effectiveTargetLine);
            if (lineIndex < 0) {
              lineIndex = lines.findIndex((l) => l.includes(effectiveTargetLine!));
            }
          }
          if (lineIndex < 0) {
            const unitMatch = patch.newLine!.match(
              /(WE\s?\d+|HAUS-\d+|TG\s?\d+|GE\s?\d+)/,
            );
            if (unitMatch) {
              lineIndex = lines.findIndex(
                (l) =>
                  l.includes(unitMatch[0]) &&
                  !l.includes("[RESOLVED") &&
                  l.trim().startsWith("- "),
              );
            }
          }

          let newSourceLines = lines;
          if (lineIndex >= 0) {
            // Also drop the immediately following `src:` trace line if present
            const dropEnd =
              lines[lineIndex + 1]?.trim().startsWith("`src:") ||
              lines[lineIndex + 1]?.includes("`src:")
                ? lineIndex + 2
                : lineIndex + 1;
            newSourceLines = [
              ...lines.slice(0, lineIndex),
              ...lines.slice(dropEnd),
            ];
          }

          let cleanSource = newSourceLines.join("\n").trim();
          if (!cleanSource) {
            // Restore the section's natural placeholder
            if (target === "open-issues") cleanSource = "*No open issues recorded.*";
            else if (target === "legal") cleanSource = "*No active legal disputes.*";
            else if (target === "pending") cleanSource = "*No pending owner actions.*";
            else if (target === "financials") cleanSource = "*No financial alerts.*";
          }

          const resolvedContent = prev["resolved"] ?? "";
          const cleanResolved = resolvedContent
            .replace("*No resolved issues yet.*", "")
            .trim();
          const resolvedBlock = `${patch.newLine!}\n  \`src: ${sourceId}\``;
          const newResolved = cleanResolved
            ? `${cleanResolved}\n${resolvedBlock}`
            : resolvedBlock;

          setPrevSections((p) => ({
            ...p,
            [target]: prev[target],
            resolved: prev["resolved"],
          }));

          return {
            ...prev,
            [target]: cleanSource,
            resolved: newResolved,
          };
        });
        setFlash((f) => ({
          ...f,
          [target]: Date.now(),
          resolved: Date.now(),
        }));
        return;
      }

      setSections((prev) => {
        setPrevSections((pSnap) => ({ ...pSnap, [target]: prev[target] }));
        const current = prev[target] ?? "";
        let next: string;

        if (effectiveAction === "append") {
          next = appendToSection(current, patch.newLine!, sourceId);
        } else if (
          (effectiveAction === "update" ||
            effectiveAction === "flag_conflict") &&
          effectiveTargetLine &&
          current.includes(effectiveTargetLine)
        ) {
          next = current.replace(
            effectiveTargetLine,
            `${patch.newLine!}\n  \`src: ${sourceId}\``,
          );
        } else {
          next = appendToSection(current, patch.newLine!, sourceId);
        }
        return { ...prev, [target]: next };
      });
      setFlash((f) => ({ ...f, [target]: Date.now() }));
    },
    [],
  );

  /** Manually append a line to a section (used by the voice assistant). */
  const patchSection = useCallback((section: SectionKey, line: string) => {
    const sourceId = `VOICE-${Date.now().toString(36)}`;
    setSections((prev) => {
      setPrevSections((p) => ({ ...p, [section]: prev[section] }));
      return { ...prev, [section]: appendToSection(prev[section], line, sourceId) };
    });
    setFlash((f) => ({ ...f, [section]: Date.now() }));
    setStats((s) => ({ ...s, sectionsUpdated: s.sectionsUpdated + 1 }));
  }, []);

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
    getSections,
    applySmartPatch,
    patchSection,
    fraudAlerts,
    dismissFraud,
  };
}
