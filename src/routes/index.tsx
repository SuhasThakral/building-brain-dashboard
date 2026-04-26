import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mic, X, AlertTriangle } from "lucide-react";
import { TopBar } from "@/components/buildingbrain/TopBar";
import { ContextFile } from "@/components/buildingbrain/ContextFile";
import { EventFeed } from "@/components/buildingbrain/EventFeed";
import { IngestPanel } from "@/components/buildingbrain/IngestPanel";
import { FraudAlerts } from "@/components/buildingbrain/FraudAlerts";
import { useSimulation } from "@/hooks/useSimulation";
import { useSmartIngest } from "@/hooks/useSmartIngest";
import { useVoiceQuery } from "@/hooks/useVoiceQuery";
import type { SectionKey } from "@/data/mockData";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "BuildingBrain — WEG Immanuelkirchstraße 26" },
      {
        name: "description",
        content:
          "AI-powered property management dashboard for WEG Immanuelkirchstraße 26, Berlin. Live event feed, fraud detection, and incremental context file updates.",
      },
    ],
  }),
});

function Index() {
  const {
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
  } = useSimulation();

  const ingest = useSmartIngest({
    getSections,
    applyPatch: (e) =>
      applySmartPatch({
        action: e.action,
        targetSection: e.targetSection,
        newLine: e.newLine,
        targetLine: e.targetLine,
        conflictNote: e.conflictNote,
        reason: e.reason,
        source: e.source,
        summary: e.summary,
      }),
  });

  const handleVoicePatch = useCallback(
    (section: SectionKey, line: string) => {
      patchSection(section, line);
    },
    [patchSection],
  );

  const voice = useVoiceQuery({
    getSections: () => getSections(),
    patchSection: handleVoicePatch,
  });

  const [ingestOpen, setIngestOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar
        onPlayDay={playDay}
        onReset={reset}
        onOpenIngest={() => setIngestOpen(true)}
        isPlaying={isPlaying}
        playingDay={playingDay}
        onVoiceStart={voice.startRecording}
        onVoiceStop={voice.stopRecording}
        voiceState={voice.state}
        voiceSupported={voice.supported}
      />

      {(voice.state === "recording" ||
        voice.state === "thinking" ||
        voice.state === "answering" ||
        voice.state === "error") && (
        <div className="flex items-start gap-3 border-b border-border bg-card/40 px-6 py-3">
          <Mic className="mt-0.5 h-4 w-4 shrink-0 text-emerald" />
          <div className="flex-1 text-xs">
            {voice.state === "recording" && (
              <>
                <span className="text-muted-foreground">Listening… </span>
                <span className="italic text-foreground/80">
                  {voice.interim || "(speak now)"}
                </span>
              </>
            )}
            {voice.state === "thinking" && (
              <span className="text-muted-foreground">
                Reading the context file…
              </span>
            )}
            {voice.state === "answering" && voice.result && (
              <>
                <span className="text-muted-foreground">You said: </span>
                <span className="italic text-foreground/80">
                  &ldquo;{voice.result.transcript}&rdquo;
                </span>
                <span className="mx-2 text-border">→</span>
                {voice.result.type === "question" ? (
                  <span className="text-emerald">{voice.result.spokenText}</span>
                ) : (
                  <span className="text-emerald">
                    Updated{" "}
                    <strong className="font-semibold">
                      {voice.result.patchedSection}
                    </strong>
                    {" — "}
                    {voice.result.spokenText}
                  </span>
                )}
                {voice.result.ttsError && (
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    (using browser voice — Gradium TTS unavailable)
                  </span>
                )}
              </>
            )}
            {voice.state === "error" && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                {voice.errorMsg ?? "Voice error"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={voice.dismiss}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <FraudAlerts alerts={fraudAlerts} onDismiss={dismissFraud} />

      <main className="flex flex-1 overflow-hidden">
        <section className="w-3/5 border-r border-border">
          <ContextFile
            sections={sections}
            prevSections={prevSections}
            flash={flash}
          />
        </section>
        <aside className="w-2/5">
          <EventFeed feed={feed} stats={stats} />
        </aside>
      </main>

      <IngestPanel
        open={ingestOpen}
        onOpenChange={setIngestOpen}
        busy={ingest.busy}
        progress={ingest.progress}
        error={ingest.error}
        history={ingest.history}
        onIngestText={ingest.ingestText}
        onIngestPdf={ingest.ingestPdf}
      />
    </div>
  );
}
