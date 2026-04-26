import { createServerFn } from "@tanstack/react-start";

const GEMINI_MODEL = "gemini-2.5-flash";

export type SmartAction =
  | "append"
  | "update"
  | "resolve"
  | "flag_conflict"
  | "ignore";

export interface SmartPatchResult {
  action: SmartAction;
  targetSection: string;
  targetLine: string | null;
  newLine: string | null;
  conflictNote: string | null;
  reason: string;
}

const SECTION_GUIDE = `Available section keys (pick exactly ONE):
- property-core: building facts, address, manager
- accounts: bank accounts, IBANs
- owners: WEG owners (Eigentümer) — STATIC table, includes Beirat (board) membership column
- tenants: renters (Mieter) — STATIC table, includes lease end dates
- contractors: service providers, caretakers, suppliers — STATIC table with monthly rates
- open-issues: defects, broken things, repair requests (🔴 / 🟠)
- legal: disputes, complaints, lawsuits (⚖️)
- pending: pending owner / WEG actions, decisions awaited (⏳)
- financials: invoices, payments, bank movements, dunning (💰)`;

function buildPrompt(input: {
  source: string;
  rawEvent: string;
  sections: Record<string, string>;
}): string {
  const sectionDump = Object.entries(input.sections)
    .map(([k, v]) => `### ${k}\n${v || "(empty)"}`)
    .join("\n\n");

  return `You manage the live context file for WEG Immanuelkirchstraße 26 (a Berlin property managed by Huber & Partner).

${SECTION_GUIDE}

CURRENT CONTEXT FILE:
${sectionDump}

NEW EVENT (source: ${input.source}):
${input.rawEvent}

Decide what to do. Be concise. Respond with JSON ONLY (no markdown fences, no commentary). Schema:
{
  "action": "append" | "update" | "resolve" | "flag_conflict" | "ignore",
  "targetSection": "<one section key from the list>",
  "targetLine": "<exact existing line text to update/resolve, or null>",
  "newLine": "<the markdown line to write (single line, may include emoji prefix), or null if action=ignore>",
  "conflictNote": "<short explanation if action=flag_conflict, else null>",
  "reason": "<one short sentence: why this action>"
}

Rules:
- "append": new info not already present
- "update": same issue/entity already present, add new detail (return the replacement line in newLine and the existing line in targetLine)
- "resolve": existing open issue is now fixed/closed → newLine should mark it [RESOLVED YYYY-MM-DD]
- "flag_conflict": new event contradicts existing data (different amount, different status). newLine should append "⚡ CONFLICT: ..." to the existing line
- "ignore": noise, marketing, irrelevant — newLine null
- Priority when sources clash: bank > ERP/Stammdaten > PDF invoice > email
- newLine must be a SINGLE markdown line, prefer "- [YYYY-MM-DD] <emoji> <summary>" format
- Always reply in English regardless of source language.

RESOLVE vs APPEND rule (CRITICAL):
- If the new event describes something being FIXED, REPAIRED, COMPLETED, CLOSED, RESOLVED, or DONE, AND the targetSection already contains an entry about the SAME unit/issue/entity → you MUST use action="resolve", NOT "append".
- When action="resolve": targetLine MUST be the EXACT verbatim text of the existing entry from the section (copy it character-for-character, including emojis and dates, but EXCLUDE any trailing "src: ..." trace lines wrapped in backticks).
- NEVER write "[RESOLVED ...]" or "✅" inside a newLine when action="append". The "[RESOLVED YYYY-MM-DD]" prefix only belongs in newLine when action="resolve".
- If multiple existing entries could match, pick the one with the same unit number (WE 49, HAUS-12, etc.) or the same issue keyword (heating, roof, elevator).
- If you are unsure whether a match exists, prefer "resolve" with your best-guess targetLine over "append".

CRITICAL — Static-table rules (owners, tenants, contractors):
- These are pre-populated tables. NEVER append free-text lines to them.
- If a fact is ALREADY captured (e.g. Beirat member already shows ✓, contractor already listed, lease end already set), prefer "ignore" unless the VALUE is actually changing.
  Example: re-electing the SAME Beirat members → ignore (no change). Only flag in "pending" if explicitly notable.
- For tenant lease changes: targetSection="tenants", action="update", targetLine = the existing tenant's row, newLine = same row with the new lease-end date.
- For contractor rate changes: targetSection="contractors", action="update", targetLine = the existing contractor's row, newLine = same row with the new monthly rate filled in (replace the dash with the amount).
- For owner changes (sale, address, Beirat status flip): targetSection="owners", action="update", targetLine = the existing owner's row.
- If you cannot find an exact matching line in a static table, fall back to "pending" (action="append") describing the change — never invent new rows in static tables.`;
}

export const smartPatch = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      source: string;
      rawEvent: string;
      sections: Record<string, string>;
    }) => {
      if (!input || typeof input.rawEvent !== "string" || !input.rawEvent.trim()) {
        throw new Error("rawEvent is required");
      }
      if (!input.sections || typeof input.sections !== "object") {
        throw new Error("sections object is required");
      }
      return {
        source: input.source || "unknown",
        rawEvent: input.rawEvent.slice(0, 12000),
        sections: input.sections,
      };
    },
  )
  .handler(async ({ data }): Promise<SmartPatchResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = buildPrompt(data);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini API error [${res.status}]: ${body.slice(0, 500)}`);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: SmartPatchResult;
    try {
      // Strip any accidental code fences
      const clean = text.replace(/^```json\s*|\s*```$/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : clean) as SmartPatchResult;
    } catch (err) {
      throw new Error(`Failed to parse Gemini response: ${text.slice(0, 300)}`);
    }

    return {
      action: parsed.action ?? "ignore",
      targetSection: parsed.targetSection ?? "open-issues",
      targetLine: parsed.targetLine ?? null,
      newLine: parsed.newLine ?? null,
      conflictNote: parsed.conflictNote ?? null,
      reason: parsed.reason ?? "",
    };
  });
