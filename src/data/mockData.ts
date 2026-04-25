// BuildingBrain — Mock Data
// Generated from real hackathon dataset: WEG Immanuelkirchstraße 26, Berlin

export type SectionKey =
  | 'property-core'
  | 'accounts'
  | 'owners'
  | 'tenants'
  | 'contractors'
  | 'open-issues'
  | 'legal'
  | 'pending'
  | 'financials'

export interface Event {
  id: string
  type: 'email' | 'invoice' | 'bank'
  sender: string
  timestamp: string
  subject: string
  isSignal: boolean
  targetSection?: SectionKey
  appendLine?: string // line appended to the target section
}

export interface DayData {
  events: Event[]
}

// ─────────────────────────────────────────────
// DAY 0 — Baseline Context File (from Stammdaten)
// ─────────────────────────────────────────────

export const DAY0_SECTIONS: Record<SectionKey, string> = {
  'property-core': `**WEG Immanuelkirchstraße 26, Berlin 10405**
Built: 1928 | Renovated: 2008 | 3 buildings | 52 units
Manager: Huber & Partner Immobilienverwaltung GmbH
Email: info@huber-partner-verwaltung.de | Tel: +49 30 12345-0
Tax No: 13/456/78901`,

  'accounts': `| Account | IBAN | Bank |
|---|---|---|
| WEG Operating | DE02 1001 0010 0123 4567 89 | Postbank Berlin |
| Reserve (Rücklage) | DE12 1203 0000 0098 7654 32 | Bayerische Landesbank |
| Manager | DE89 3704 0044 0532 0130 00 | Commerzbank Berlin |`,

  'owners': `| ID | Name | Units | Beirat | SEV |
|---|---|---|---|---|
| EIG-001 | Marcus Dowerg | WE 32, GE 37 | – | ✓ |
| EIG-003 | Arnulf Heintze | WE 25, WE 49 | – | ✓ |
| EIG-004 | Erdal Beckmann | WE 43, WE 15 | ✓ | – |
| EIG-007 | Anni Wagenknecht | WE 48, WE 44 | – | – |
| EIG-010 | Ingbert Nerger | TG 52, WE 50 | ✓ | – |
| EIG-015 | Kranz Vermoegensverwaltung | WE 11, WE 17 | – | – |
| EIG-016 | Wolfgang Hettner | WE 34, WE 10 | – | ✓ |
| EIG-017 | Osman Jacob | WE 01, WE 30 | – | – |
| EIG-018 | Irmingard Margraf | TG 18 | – | – |
| EIG-020 | Ronald Kelley | WE 45 | ✓ | – |
| EIG-022 | Tom Hartmann | WE 29 | – | – |
| EIG-028 | Oswald Gröttner | WE 22 | – | ✓ |
| EIG-035 | Markus Fliegner | WE 06 | – | ✓ |
| *(22 more owners — see full register)* | | | | |`,

  'tenants': `| ID | Name | Unit | Rent/mo | Since | Lease End |
|---|---|---|---|---|---|
| MIE-001 | Julius Nette | WE 25 | €1,676 | 2022-07-11 | — |
| MIE-003 | Joanna Schäfer | WE 49 | €2,019 | 2020-03-22 | — |
| MIE-004 | Horst-Günter Zänker | WE 51 | €1,537 | 2021-07-23 | — |
| MIE-009 | Marliese Hermann | WE 02 | €864 | 2021-01-21 | — |
| MIE-015 | Hanna Schweitzer | WE 34 | €2,404 | 2024-09-01 | — |
| MIE-016 | Magrit Mitschke | WE 32 | €901 | 2021-08-27 | — |
| MIE-017 | Edeltraud Renner | WE 29 | €2,091 | 2024-03-24 | — |
| MIE-021 | Galina Wohlgemut | WE 41 | €2,111 | 2021-11-14 | — |
| MIE-024 | Anette Vogt | WE 09 | €1,330 | 2020-10-30 | **2026-02-27** |
| *(17 more tenants — see full register)* | | | | | |`,

  'contractors': `| ID | Company | Branch | Contact | Monthly | Hourly |
|---|---|---|---|---|---|
| DL-001 | Hausmeister Mueller GmbH | Caretaker | Slawomir Sölzer | €650 | €42 |
| DL-002 | Aufzug Schindler & Co. | Elevator | Paul-Heinz Köhler | €185 | €95 |
| DL-003 | Heiztechnik Berlin GmbH | Heating | Olga Holsten | — | €78 |
| DL-004 | Reinigungsservice Kowalski | Cleaning | Malte Becker | €420 | €22 |
| DL-005 | Gaertnerei Gruener Daumen | Garden | Ekkehart Wende | €180 | €32 |
| DL-007 | Allianz Versicherungs-AG | Insurance | Rolf Schönland | — | — |
| DL-009 | GASAG Berliner Gaswerke | Gas | Irmengard Mentzel | — | — |
| DL-012 | Elektro Schmidt e.K. | Electrician | Carola Buchholz | — | €65 |
| DL-013 | Sanitaer Schulze GmbH | Plumbing | Ernst-August Jessel | — | €72 |
| DL-014 | Dachdecker Richter | Roofing | Catherine Heydrich | — | €68 |
| DL-015 | SecureLock Systems Ltd. | Locks | Thomas Kennedy | — | €85 |`,

  'open-issues': `*No open issues recorded.*`,

  'legal': `*No active legal disputes.*`,

  'pending': `*No pending owner actions.*`,

  'financials': `*No financial alerts.*`,
}

// ─────────────────────────────────────────────
// SIMULATION — Days 1–10 (January 2026)
// ─────────────────────────────────────────────

export const SIMULATION_DAYS: Record<number, DayData> = {
  1: {
    events: [
      {
        id: 'EMAIL-06547',
        type: 'email',
        sender: 'Oswald Gröttner (EIG-028)',
        timestamp: '2026-01-01 08:38',
        subject: 'Sonderumlage - Einspruch',
        isSignal: true,
        targetSection: 'legal',
        appendLine:
          '- [2026-01-01] **EIG-028 Oswald Gröttner** (WE 22) contests Sonderumlage of **€4,264** — claims resolution was not properly adopted at ETV',
      },
      {
        id: 'EMAIL-06548',
        type: 'email',
        sender: 'Joanna Schäfer (MIE-003)',
        timestamp: '2026-01-01 11:08',
        subject: 'Frage zu Kaution',
        isSignal: true,
        targetSection: 'pending',
        appendLine:
          '- [2026-01-01] **MIE-003 Joanna Schäfer** (WE 49) — deposit return overdue (7 weeks since move-out) — action required',
      },
      {
        id: 'EMAIL-06549',
        type: 'email',
        sender: 'Berliner Wasserbetriebe (DL-010)',
        timestamp: '2026-01-01 17:12',
        subject: 'Jahresabrechnung 2025',
        isSignal: false,
      },
      {
        id: 'INV-00195',
        type: 'invoice',
        sender: 'Hausmeister Mueller GmbH (DL-001)',
        timestamp: '2026-01-01',
        subject: 'INV-2026-0195 — Caretaker services',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-01] Invoice **INV-2026-0195** — Hausmeister Mueller GmbH — **€1,088.85** (net €915.00 + VAT) — paid 2026-01-06',
      },
    ],
  },

  2: {
    events: [
      {
        id: 'EMAIL-06551',
        type: 'email',
        sender: 'Allianz Versicherungs-AG (DL-007)',
        timestamp: '2026-01-02 08:26',
        subject: 'Abschlagsanpassung',
        isSignal: false,
      },
      {
        id: 'EMAIL-06552',
        type: 'email',
        sender: 'Anni Wagenknecht (EIG-007)',
        timestamp: '2026-01-02 10:25',
        subject: 'Mieterwechsel in WE 48',
        isSignal: true,
        targetSection: 'pending',
        appendLine:
          '- [2026-01-02] **EIG-007 Anni Wagenknecht** (WE 48) — tenant departing 2026-02-28 — handover + re-letting coordination needed',
      },
      {
        id: 'EMAIL-06554',
        type: 'email',
        sender: 'Allianz Versicherungs-AG (DL-007)',
        timestamp: '2026-01-02 13:32',
        subject: 'Mahnung Rechnung RE-2026-8503',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-02] ⚠️ **OVERDUE** — Allianz Versicherungs-AG invoice RE-2026-8503 — payment reminder received',
      },
      {
        id: 'INV-00196',
        type: 'invoice',
        sender: 'Elektro Schmidt e.K. (DL-012)',
        timestamp: '2026-01-02',
        subject: 'INV-2026-0196 — Electrical work',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-02] Invoice **INV-2026-0196** — Elektro Schmidt e.K. — **€569.42** (net €478.50 + VAT) — paid 2026-01-03',
      },
    ],
  },

  3: {
    events: [
      {
        id: 'EMAIL-06555',
        type: 'email',
        sender: 'Magrit Mitschke (MIE-016)',
        timestamp: '2026-01-03 12:33',
        subject: 'Mietminderung Ankündigung',
        isSignal: true,
        targetSection: 'legal',
        appendLine:
          '- [2026-01-03] **MIE-016 Magrit Mitschke** (WE 32) announces **15% rent reduction** from 2026-02-02 — cites unresolved water damage + mold (3+ months unresolved)',
      },
      {
        id: 'EMAIL-06556',
        type: 'email',
        sender: 'Silja Henschel (EIG-026)',
        timestamp: '2026-01-03 12:56',
        subject: 'Frage zur Hausgeldabrechnung',
        isSignal: false,
      },
      {
        id: 'EMAIL-06557',
        type: 'email',
        sender: 'Osman Jacob (EIG-017)',
        timestamp: '2026-01-03 16:41',
        subject: 'Modernisierung - Zustimmung',
        isSignal: true,
        targetSection: 'pending',
        appendLine:
          '- [2026-01-03] **EIG-017 Osman Jacob** (WE 01) — requests WEG approval for non-load-bearing wall removal in kitchen',
      },
      {
        id: 'INV-00197',
        type: 'invoice',
        sender: 'Elektro Schmidt e.K. (DL-012)',
        timestamp: '2026-01-03',
        subject: 'INV-2026-0197 — Electrical repair',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-03] Invoice **INV-2026-0197** — Elektro Schmidt e.K. — **€57.71** (net €48.50 + VAT) — paid 2026-01-08',
      },
    ],
  },

  4: {
    events: [
      {
        id: 'EMAIL-06559',
        type: 'email',
        sender: 'Hanna Schweitzer (MIE-015)',
        timestamp: '2026-01-04 11:38',
        subject: 'Kündigung Mietvertrag',
        isSignal: true,
        targetSection: 'tenants',
        appendLine:
          '- [2026-01-04] **MIE-015 Hanna Schweitzer** (WE 34) — notice to quit received — earliest exit date: **2026-04-30**',
      },
      {
        id: 'EMAIL-06560',
        type: 'email',
        sender: 'Louise Ladeck (MIE-018)',
        timestamp: '2026-01-04 12:29',
        subject: 'Ruhestörung',
        isSignal: true,
        targetSection: 'open-issues',
        appendLine:
          '- [2026-01-04] **MIE-018 Louise Ladeck** (WE 35) — persistent noise complaint against neighbor — investigation pending',
      },
      {
        id: 'EMAIL-06562',
        type: 'email',
        sender: 'Kranz Vermoegensverwaltung (EIG-015)',
        timestamp: '2026-01-04 15:48',
        subject: 'Verkaufsabsicht WE 11',
        isSignal: true,
        targetSection: 'pending',
        appendLine:
          '- [2026-01-04] **EIG-015 Kranz Vermoegensverwaltung** (WE 11) — intent to sell — requesting Hausgeld certificate + last 3 ETV protocols',
      },
      {
        id: 'INV-00198',
        type: 'invoice',
        sender: 'Hausmeister Mueller GmbH (DL-001)',
        timestamp: '2026-01-04',
        subject: 'INV-2026-0198 — Caretaker services',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-04] Invoice **INV-2026-0198** — Hausmeister Mueller GmbH — **€1,088.85** (net €915.00 + VAT) — paid 2026-01-09',
      },
    ],
  },

  5: {
    events: [
      {
        id: 'EMAIL-06563',
        type: 'email',
        sender: 'Hausmeister Mueller GmbH (DL-001)',
        timestamp: '2026-01-05 11:45',
        subject: 'Rechnung RE-2026-1492',
        isSignal: false,
      },
      {
        id: 'EMAIL-06564',
        type: 'email',
        sender: 'Irmingard Margraf (EIG-018)',
        timestamp: '2026-01-05 13:42',
        subject: 'Sonderumlage - Einspruch',
        isSignal: true,
        targetSection: 'legal',
        appendLine:
          '- [2026-01-05] **EIG-018 Irmingard Margraf** (TG 18) contests Sonderumlage — 2nd formal objection filed (joins Gröttner)',
      },
      {
        id: 'INV-00199',
        type: 'invoice',
        sender: 'Hausmeister Mueller GmbH (DL-001)',
        timestamp: '2026-01-05',
        subject: 'INV-2026-0199 — Caretaker extra work',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-05] Invoice **INV-2026-0199** — Hausmeister Mueller GmbH — **€987.70** (net €830.00 + VAT) — paid 2026-01-07',
      },
      {
        id: 'TX-01624',
        type: 'bank',
        sender: 'Postbank Berlin',
        timestamp: '2026-01-07',
        subject: 'DEBIT €987.70 — Hausmeister Mueller GmbH',
        isSignal: false,
      },
    ],
  },

  6: {
    events: [
      {
        id: 'EMAIL-06567',
        type: 'email',
        sender: 'Tom Hartmann (EIG-022)',
        timestamp: '2026-01-06 09:31',
        subject: 'Sonderumlage - Einspruch',
        isSignal: true,
        targetSection: 'legal',
        appendLine:
          '- [2026-01-06] **EIG-022 Tom Hartmann** (WE 29) contests Sonderumlage of **€4,264** — 3rd formal objection (legal review recommended)',
      },
      {
        id: 'EMAIL-06568',
        type: 'email',
        sender: 'Allianz Versicherungs-AG (DL-007)',
        timestamp: '2026-01-06 15:16',
        subject: 'Rechnung RE-2026-2285',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-06] Invoice **RE-2026-2285** — Allianz Versicherungs-AG (insurance premium) — amount pending confirmation',
      },
      {
        id: 'EMAIL-06569',
        type: 'email',
        sender: 'Carsten Austermühle (MIE-022)',
        timestamp: '2026-01-06 16:05',
        subject: 'Internet/TV-Anschluss',
        isSignal: false,
      },
      {
        id: 'INV-00200',
        type: 'invoice',
        sender: 'Sanitaer Schulze GmbH (DL-013)',
        timestamp: '2026-01-06',
        subject: 'INV-2026-0200 — Plumbing repair',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-06] Invoice **INV-2026-0200** — Sanitaer Schulze GmbH — **€211.11** (net €177.40 + VAT) — paid 2026-01-10',
      },
    ],
  },

  7: {
    events: [
      {
        id: 'EMAIL-06571',
        type: 'email',
        sender: 'Winfried Ullmann (EIG-006)',
        timestamp: '2026-01-07 10:15',
        subject: 'Modernisierung - Zustimmung',
        isSignal: true,
        targetSection: 'pending',
        appendLine:
          '- [2026-01-07] **EIG-006 Winfried Ullmann** (WE 26, WE 27) — requests WEG approval for kitchen wall modification (non-structural)',
      },
      {
        id: 'EMAIL-06572',
        type: 'email',
        sender: 'Sanitaer Schulze GmbH (DL-013)',
        timestamp: '2026-01-07 10:54',
        subject: 'Wartungsbericht',
        isSignal: false,
      },
      {
        id: 'EMAIL-06573',
        type: 'email',
        sender: 'GASAG Berliner Gaswerke (DL-009)',
        timestamp: '2026-01-07 17:26',
        subject: 'Rechnung RE-2026-6322',
        isSignal: false,
      },
      {
        id: 'INV-00201',
        type: 'invoice',
        sender: 'Reinigungsservice Kowalski (DL-004)',
        timestamp: '2026-01-07',
        subject: 'INV-2026/00201 — Stairwell cleaning',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-07] Invoice **INV-2026/00201** — Reinigungsservice Kowalski — **€403.65** (net €339.20 + VAT) — paid 2026-01-12',
      },
    ],
  },

  8: {
    events: [
      {
        id: 'EMAIL-06575',
        type: 'email',
        sender: 'Magrit Mitschke (MIE-016)',
        timestamp: '2026-01-08 10:53',
        subject: 'Internet/TV-Anschluss',
        isSignal: false,
      },
      {
        id: 'EMAIL-06576',
        type: 'email',
        sender: 'Galina Wohlgemut (MIE-021)',
        timestamp: '2026-01-08 14:58',
        subject: 'Haustür schliesst nicht',
        isSignal: true,
        targetSection: 'open-issues',
        appendLine:
          '- [2026-01-08] 🔴 **URGENT** — **MIE-021 Galina Wohlgemut** (WE 41) — front door HAUS-16 not self-closing since midday — security risk — caretaker dispatched',
      },
      {
        id: 'EMAIL-06577',
        type: 'email',
        sender: 'Edeltraud Renner (MIE-017)',
        timestamp: '2026-01-08 17:46',
        subject: 'Mietminderung Ankündigung',
        isSignal: true,
        targetSection: 'legal',
        appendLine:
          '- [2026-01-08] **MIE-017 Edeltraud Renner** (WE 29) announces rent reduction — citing unresolved defects in apartment',
      },
      {
        id: 'INV-00202',
        type: 'invoice',
        sender: 'Elektro Schmidt e.K. (DL-012)',
        timestamp: '2026-01-08',
        subject: 'INV-2026-0202 — Electrical repair',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-08] Invoice **INV-2026-0202** — Elektro Schmidt e.K. — **€214.20** (net €180.00 + VAT) — paid 2026-01-09',
      },
    ],
  },

  9: {
    events: [
      {
        id: 'EMAIL-06579',
        type: 'email',
        sender: 'Irmingard Margraf (EIG-018)',
        timestamp: '2026-01-09 12:06',
        subject: 'SEV - Monatsauszug',
        isSignal: false,
      },
      {
        id: 'EMAIL-06580',
        type: 'email',
        sender: 'Reinigungsservice Kowalski (DL-004)',
        timestamp: '2026-01-09 13:03',
        subject: 'Nachtrag Reparatur',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-09] ⚠️ Supplemental billing request — Reinigungsservice Kowalski — additional repair work not covered by INV-00201 — amount TBC',
      },
      {
        id: 'EMAIL-06581',
        type: 'email',
        sender: 'Ronald Kelley (EIG-020, Beirat)',
        timestamp: '2026-01-09 16:16',
        subject: 'Question about annual statement',
        isSignal: true,
        targetSection: 'pending',
        appendLine:
          '- [2026-01-09] **EIG-020 Ronald Kelley** (WE 45, Beirat) 🇬🇧 — EN: requesting clarification on 2025 annual statement line items — reply in English required',
      },
      {
        id: 'INV-00203',
        type: 'invoice',
        sender: 'Heiztechnik Berlin GmbH (DL-003)',
        timestamp: '2026-01-09',
        subject: 'INV-2026/00203 — Heating maintenance',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-09] Invoice **INV-2026/00203** — Heiztechnik Berlin GmbH — **€986.27** (net €828.80 + VAT) — paid 2026-01-14',
      },
    ],
  },

  10: {
    events: [
      {
        id: 'EMAIL-06583',
        type: 'email',
        sender: 'Edeltraud Renner (MIE-017)',
        timestamp: '2026-01-10 15:14',
        subject: 'Kündigung Mietvertrag',
        isSignal: true,
        targetSection: 'tenants',
        appendLine:
          '- [2026-01-10] **MIE-017 Edeltraud Renner** (WE 29) — notice to quit received — earliest exit date: **2026-04-30** — deposit return to process',
      },
      {
        id: 'EMAIL-06584',
        type: 'email',
        sender: 'Heiztechnik Berlin GmbH (DL-003)',
        timestamp: '2026-01-10 16:19',
        subject: 'Rechnung RE-2026-6913',
        isSignal: false,
      },
      {
        id: 'EMAIL-06585',
        type: 'email',
        sender: 'Marliese Hermann (MIE-009)',
        timestamp: '2026-01-10 16:38',
        subject: 'Schlüsselverlust',
        isSignal: true,
        targetSection: 'open-issues',
        appendLine:
          '- [2026-01-10] **MIE-009 Marliese Hermann** (WE 02) — key lost — Schließanlage replacement may be required — contact DL-015 SecureLock',
      },
      {
        id: 'INV-00204',
        type: 'invoice',
        sender: 'Sanitaer Schulze GmbH (DL-013)',
        timestamp: '2026-01-10',
        subject: 'INV-2026-0204 — Plumbing repair',
        isSignal: true,
        targetSection: 'financials',
        appendLine:
          '- [2026-01-10] Invoice **INV-2026-0204** — Sanitaer Schulze GmbH — **€65.45** (net €55.00 + VAT) — paid 2026-01-14',
      },
    ],
  },
}
