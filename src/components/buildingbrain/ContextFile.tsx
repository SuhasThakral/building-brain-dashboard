import { SectionCard } from "./SectionCard";
import type { SectionKey } from "@/data/mockData";

interface SectionDef {
  key: SectionKey;
  title: string;
  badge: "grey" | "blue" | "red" | "orange" | "yellow";
}

const SECTIONS: SectionDef[] = [
  { key: "property-core", title: "Property Core", badge: "grey" },
  { key: "accounts", title: "Bank Accounts", badge: "grey" },
  { key: "owners", title: "Owners", badge: "blue" },
  { key: "tenants", title: "Tenants", badge: "blue" },
  { key: "contractors", title: "Service Providers", badge: "blue" },
  { key: "open-issues", title: "Open Issues", badge: "red" },
  { key: "legal", title: "Legal Disputes", badge: "orange" },
  { key: "pending", title: "Pending Owner Actions", badge: "yellow" },
  { key: "financials", title: "Financial Alerts", badge: "red" },
];

interface ContextFileProps {
  sections: Record<SectionKey, string>;
  prevSections: Record<SectionKey, string>;
  flash: Record<string, number>;
}

export function ContextFile({
  sections,
  prevSections,
  flash,
}: ContextFileProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-6 py-2.5 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="font-mono">context-file.md</span>
        <span className="text-border">/</span>
        <span>9 sections</span>
      </div>
      <div className="bb-scroll flex-1 space-y-3 overflow-y-auto p-4">
        {SECTIONS.map((s) => (
          <SectionCard
            key={s.key}
            sectionKey={s.key}
            title={s.title}
            badge={s.badge}
            content={sections[s.key]}
            previousContent={prevSections[s.key]}
            flashAt={flash[s.key]}
          />
        ))}
      </div>
    </div>
  );
}
