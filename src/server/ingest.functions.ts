import { createServerFn } from "@tanstack/react-start";

const GEMINI_MODEL = "gemini-2.0-flash";

export interface ExtractedEvent {
  source: string;
  summary: string;
}

export interface ExtractResult {
  events: ExtractedEvent[];
  rawText: string;
}

const EXTRACT_PROMPT = `You are extracting actionable events from a property-management document for WEG Immanuelkirchstraße 26 Berlin.

The document may be: an email, an invoice (Rechnung), a bank statement line, a letter (Brief), or free-form text. It may be in German or English.

Return JSON ONLY:
{
  "events": [
    { "source": "<short label e.g. 'Invoice DL-001 INV-00195' or 'Email from caretaker'>", "summary": "<one-sentence English summary including key facts: dates, amounts in EUR, names, unit numbers, problem/action>" }
  ]
}

Rules:
- Extract every distinct fact that could affect the building's open issues, finances, owners, tenants, contractors, or legal status.
- Translate German to English in the summary.
- Include amounts (€), invoice numbers, unit numbers (WE xx), dates (YYYY-MM-DD).
- If nothing actionable, return { "events": [] }.
- Maximum 8 events.`;

async function callGemini(parts: Array<Record<string, unknown>>): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.1,
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
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function parseEvents(text: string): ExtractedEvent[] {
  try {
    const clean = text.replace(/^```json\s*|\s*```$/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : clean) as { events?: ExtractedEvent[] };
    return Array.isArray(parsed.events) ? parsed.events.slice(0, 8) : [];
  } catch {
    return [];
  }
}

/** Extract events from free-form text (email body, pasted note, etc.) */
export const extractFromText = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string; sourceLabel?: string }) => {
    if (!input?.text?.trim()) throw new Error("text is required");
    return {
      text: input.text.slice(0, 16000),
      sourceLabel: input.sourceLabel || "Pasted text",
    };
  })
  .handler(async ({ data }): Promise<ExtractResult> => {
    const text = await callGemini([
      { text: EXTRACT_PROMPT },
      { text: `\n\nSOURCE LABEL: ${data.sourceLabel}\n\nDOCUMENT:\n${data.text}` },
    ]);
    return { events: parseEvents(text), rawText: data.text.slice(0, 800) };
  });

/** Extract events from a base64-encoded PDF using Gemini's native PDF support */
export const extractFromPdf = createServerFn({ method: "POST" })
  .inputValidator((input: { base64: string; filename?: string }) => {
    if (!input?.base64) throw new Error("base64 PDF data is required");
    // Cap ~8 MB base64 (~6 MB PDF) to stay within request limits
    if (input.base64.length > 8_000_000) {
      throw new Error("PDF too large (max ~6 MB)");
    }
    return {
      base64: input.base64,
      filename: input.filename || "uploaded.pdf",
    };
  })
  .handler(async ({ data }): Promise<ExtractResult> => {
    const text = await callGemini([
      { text: EXTRACT_PROMPT },
      { text: `\n\nSOURCE LABEL: PDF "${data.filename}"\n\nDOCUMENT:` },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: data.base64,
        },
      },
    ]);
    return {
      events: parseEvents(text),
      rawText: `PDF: ${data.filename}`,
    };
  });
