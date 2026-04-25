# BuildingBrain — Lovable Dashboard (Mock-Data Demo)

A fully self-contained version of BuildingBrain that runs entirely in the Lovable preview using your uploaded `mockData.ts` (Day 0 baseline + Days 1–10 events). No FastAPI backend needed — you can see it and play with it right away.

## Top Bar
- Building name: **WEG Immanuelkirchstraße 26, Berlin**
- Green pulsing **Live** dot
- **Run Day** dropdown (Day 1–10) + **Play** button
- **Reset** button — restores Day 0 baseline, clears the feed and counters
- Dark theme, emerald accent, clean sans-serif UI

## Left Panel (60%) — Context File Viewer
- Renders the 9 sections from `DAY0_SECTIONS` as Markdown via `react-markdown` + `remark-gfm` (so the tables in your mock data render correctly)
- Monospace font for the markdown content (code-editor feel)
- Each section card has a colored header badge:
  - Property Core, Bank Accounts → **grey**
  - Owners, Tenants, Service Providers → **blue**
  - Open Issues, Financial Alerts → **red**
  - Legal Disputes → **orange**
  - Pending Owner Actions → **yellow**
- When a section receives an appended line:
  - Card briefly **flashes emerald green**
  - Shows an **"Updated just now"** timestamp badge on the header (auto-fades after ~30s)
- **Show diff** button per section toggles a before/after view: removed text struck through in red, new lines highlighted in green

## Right Panel (40%) — Event Feed
- 3 live stat counters at the top: **Events processed today**, **Sections updated**, **Noise filtered**
- Scrollable feed, newest at top. Each event card shows:
  - Icon by type: ✉️ email, 📄 invoice, 🏦 bank
  - Sender name + timestamp
  - One-line subject/description
  - Section badge: `→ Open Issues` (signal) or `→ Ignored (noise)`
- Noise cards rendered greyed out with a **NOISE** tag — context file does not change

## Demo Mode
- Click **Play** for a selected day → events from that day in `mockData.ts` animate into the feed one at a time (1 second apart)
- Signal events: append `appendLine` to the matching section, trigger green flash + "Updated just now" badge, increment counters
- Noise events: card appears greyed out with NOISE tag, increment noise counter only
- Days are cumulative — running Day 2 after Day 1 keeps Day 1 changes
- **Reset** restores everything to the Day 0 baseline

## Files I'll create
- `src/data/mockData.ts` — your uploaded file, copied verbatim
- `src/routes/index.tsx` — replace the placeholder with the full two-panel dashboard
- `src/components/buildingbrain/TopBar.tsx`
- `src/components/buildingbrain/ContextFile.tsx`
- `src/components/buildingbrain/SectionCard.tsx` (markdown render, flash, diff toggle, badge)
- `src/components/buildingbrain/EventFeed.tsx` (stats + scrollable list)
- `src/components/buildingbrain/EventCard.tsx` (signal vs noise styling, gracefully handles both `status` and `appendLine`)
- `src/hooks/useSimulation.ts` (sections, events, stats, flash timing, day playback, reset)
- Small additions to `src/styles.css` for the emerald flash keyframes and monospace section content

## Dependencies to add
- `react-markdown`
- `remark-gfm` (for the markdown tables in your mock data)

## Out of scope (per your earlier choice)
No FastAPI backend, no API polling, no Gemini calls, no file uploads. Pure mock-driven so you can see it running in Lovable immediately. The component shapes (especially `EventCard` reading `event.status || event.appendLine`) stay compatible so swapping in the real backend later is a one-hook change.
