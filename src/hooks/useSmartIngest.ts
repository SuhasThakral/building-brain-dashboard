import { useCallback, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { smartPatch, type SmartAction } from "@/server/smartPatch.functions";
import {
  extractFromPdf,
  extractFromText,
  type ExtractedEvent,
} from "@/server/ingest.functions";
import type { SectionKey } from "@/data/mockData";

export interface IngestedEvent {
  id: string;
  source: string;
  summary: string;
  action: SmartAction;
  targetSection: SectionKey;
  newLine: string | null;
  targetLine: string | null;
  conflictNote: string | null;
  reason: string;
  timestamp: number;
}

const VALID_SECTIONS: SectionKey[] = [
  "property-core",
  "accounts",
  "owners",
  "tenants",
  "contractors",
  "open-issues",
  "legal",
  "pending",
  "financials",
];

function normalizeSection(s: string): SectionKey {
  return (VALID_SECTIONS as string[]).includes(s)
    ? (s as SectionKey)
    : "open-issues";
}

interface UseSmartIngestProps {
  getSections: () => Record<SectionKey, string>;
  applyPatch: (event: IngestedEvent) => void;
}

export function useSmartIngest({ getSections, applyPatch }: UseSmartIngestProps) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<IngestedEvent[]>([]);

  const extractTextFn = useServerFn(extractFromText);
  const extractPdfFn = useServerFn(extractFromPdf);
  const smartPatchFn = useServerFn(smartPatch);

  const processExtractedEvents = useCallback(
    async (events: ExtractedEvent[]) => {
      const results: IngestedEvent[] = [];
      for (let i = 0; i < events.length; i++) {
        const evt = events[i];
        setProgress(`Smart-patching ${i + 1}/${events.length}…`);
        try {
          const patch = await smartPatchFn({
            data: {
              source: evt.source,
              rawEvent: evt.summary,
              sections: getSections(),
            },
          });
          const ingested: IngestedEvent = {
            id: `ING-${Date.now()}-${i}`,
            source: evt.source,
            summary: evt.summary,
            action: patch.action,
            targetSection: normalizeSection(patch.targetSection),
            newLine: patch.newLine,
            targetLine: patch.targetLine,
            conflictNote: patch.conflictNote,
            reason: patch.reason,
            timestamp: Date.now(),
          };
          results.push(ingested);
          applyPatch(ingested);
          setHistory((h) => [ingested, ...h]);
        } catch (err) {
          console.error("smartPatch failed", err);
        }
      }
      return results;
    },
    [smartPatchFn, getSections, applyPatch],
  );

  const ingestText = useCallback(
    async (text: string, sourceLabel?: string) => {
      setBusy(true);
      setError(null);
      setProgress("Extracting events…");
      try {
        const result = await extractTextFn({
          data: { text, sourceLabel },
        });
        if (!result.events.length) {
          setError("No actionable events found in the text.");
          return [];
        }
        return await processExtractedEvents(result.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return [];
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [extractTextFn, processExtractedEvents],
  );

  const ingestPdf = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      setProgress(`Reading ${file.name}…`);
      try {
        const buf = await file.arrayBuffer();
        // Convert ArrayBuffer → base64 in chunks (avoid call stack overflow on large files)
        let binary = "";
        const bytes = new Uint8Array(buf);
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode.apply(
            null,
            Array.from(bytes.subarray(i, i + chunk)),
          );
        }
        const base64 = btoa(binary);

        setProgress("Asking Gemini to read the PDF…");
        const result = await extractPdfFn({
          data: { base64, filename: file.name },
        });
        if (!result.events.length) {
          setError("Gemini found no actionable events in the PDF.");
          return [];
        }
        return await processExtractedEvents(result.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return [];
      } finally {
        setBusy(false);
        setProgress(null);
      }
    },
    [extractPdfFn, processExtractedEvents],
  );

  return { busy, progress, error, history, ingestText, ingestPdf };
}
