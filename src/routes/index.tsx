import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/buildingbrain/TopBar";
import { ContextFile } from "@/components/buildingbrain/ContextFile";
import { EventFeed } from "@/components/buildingbrain/EventFeed";
import { IngestPanel } from "@/components/buildingbrain/IngestPanel";
import { useSimulation } from "@/hooks/useSimulation";
import { useSmartIngest } from "@/hooks/useSmartIngest";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "BuildingBrain — WEG Immanuelkirchstraße 26" },
      {
        name: "description",
        content:
          "AI-powered property management dashboard for WEG Immanuelkirchstraße 26, Berlin. Live event feed and incremental context file updates.",
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
  } = useSimulation();

  const ingest = useSmartIngest({
    getSections,
    applyPatch: (e) => applySmartPatch({
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

  const [ingestOpen, setIngestOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar
        onPlayDay={playDay}
        onReset={reset}
        onOpenIngest={() => setIngestOpen(true)}
        isPlaying={isPlaying}
        playingDay={playingDay}
      />

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
