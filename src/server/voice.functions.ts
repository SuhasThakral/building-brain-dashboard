import { createServerFn } from "@tanstack/react-start";

const GEMINI_MODEL = "gemini-2.5-flash";
const GRADIUM_VOICE_ID = "YTpq7expH9539ERJ"; // Emma — default neutral voice from docs

export type VoiceIntent = "question" | "statement";

export interface VoicePlan {
  type: VoiceIntent;
  answer: string | null;
  patchedSection: string | null;
  patchLine: string | null;
  spokenText: string;
}

export interface VoiceQueryResult extends VoicePlan {
  transcript: string;
  audioBase64: string | null; // base64 wav (may be null if TTS failed)
  audioMime: string;
  ttsError?: string;
}

const SECTION_KEYS = [
  "property-core",
  "accounts",
  "owners",
  "tenants",
  "contractors",
  "open-issues",
  "legal",
  "pending",
  "financials",
] as const;

function buildPrompt(transcript: string, sections: Record<string, string>) {
  const dump = Object.entries(sections)
    .map(([k, v]) => `### ${k}\n${v || "(empty)"}`)
    .join("\n\n");
  const today = new Date().toISOString().slice(0, 10);
  return `You are the voice assistant for WEG Immanuelkirchstraße 26 in Berlin.

The property manager just spoke into a mic. Their words: "${transcript}"

Decide if this is:
- a QUESTION about the building (answer it from the context file), OR
- a STATEMENT (a new fact to record / an issue resolution).

CURRENT CONTEXT FILE:
${dump}

Section keys you may patch: ${SECTION_KEYS.join(", ")}

Reply with JSON ONLY:
{
  "type": "question" | "statement",
  "answer": "<1-2 sentence spoken answer if question, else null>",
  "patchedSection": "<section key if statement, else null>",
  "patchLine": "<single markdown line to APPEND if statement (format: '- [${today}] <emoji> <fact>'), else null>",
  "spokenText": "<the exact short sentence to speak back to the user — for a question this is the answer, for a statement it confirms what was recorded (e.g. 'Done. WE 49 boiler marked resolved.')>"
}

Rules:
- spokenText is mandatory and ≤ 25 words, conversational, no markdown.
- If a statement resolves an existing issue, the patchLine should mark it [RESOLVED ${today}].
- If you cannot tell, default to question with a short clarifying answer.`;
}

async function classify(transcript: string, sections: Record<string, string>): Promise<VoicePlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildPrompt(transcript, sections) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini error [${res.status}]: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const clean = text.replace(/^```json\s*|\s*```$/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : clean) as Partial<VoicePlan>;

  return {
    type: parsed.type === "statement" ? "statement" : "question",
    answer: parsed.answer ?? null,
    patchedSection: parsed.patchedSection ?? null,
    patchLine: parsed.patchLine ?? null,
    spokenText:
      parsed.spokenText ||
      parsed.answer ||
      "Sorry, I could not produce an answer.",
  };
}

/**
 * Synthesize speech via Gradium WebSocket TTS.
 * Connects, sends text, collects all audio chunks, returns concatenated base64 WAV.
 * Resolves with null on any error (TTS is non-fatal).
 */
async function synthesize(text: string): Promise<{ audio: string | null; error?: string }> {
  const apiKey = process.env.GRADIUM_API_KEY;
  if (!apiKey) return { audio: null, error: "GRADIUM_API_KEY missing" };
  if (!text.trim()) return { audio: null };

  return new Promise((resolve) => {
    let settled = false;
    const finish = (audio: string | null, error?: string) => {
      if (settled) return;
      settled = true;
      try {
        ws.close();
      } catch {
        // ignore
      }
      resolve({ audio, error });
    };

    let ws: WebSocket;
    try {
      // Some Workers don't allow custom headers on WebSocket — try query param fallback
      ws = new WebSocket(`wss://api.gradium.ai/api/speech/tts`, {
        // @ts-expect-error — headers supported in Workers/undici
        headers: { "x-api-key": apiKey },
      });
    } catch (err) {
      return finish(null, err instanceof Error ? err.message : "ws construct failed");
    }

    const chunks: string[] = [];
    const timeout = setTimeout(() => finish(null, "tts timeout"), 15000);

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          type: "setup",
          model_name: "default",
          voice_id: GRADIUM_VOICE_ID,
          output_format: "wav",
        }),
      );
    });

    ws.addEventListener("message", (evt: MessageEvent) => {
      try {
        const raw = typeof evt.data === "string" ? evt.data : "";
        if (!raw) return;
        const msg = JSON.parse(raw) as { type: string; audio?: string; message?: string };
        if (msg.type === "ready") {
          ws.send(JSON.stringify({ type: "text", text }));
          ws.send(JSON.stringify({ type: "end_of_stream" }));
        } else if (msg.type === "audio" && msg.audio) {
          chunks.push(msg.audio);
        } else if (msg.type === "end_of_stream") {
          clearTimeout(timeout);
          finish(chunks.length ? mergeWavBase64(chunks) : null);
        } else if (msg.type === "error") {
          clearTimeout(timeout);
          finish(null, msg.message || "gradium error");
        }
      } catch {
        // ignore parse errors
      }
    });

    ws.addEventListener("error", () => {
      clearTimeout(timeout);
      finish(null, "ws error");
    });
    ws.addEventListener("close", () => {
      clearTimeout(timeout);
      if (!settled) finish(chunks.length ? mergeWavBase64(chunks) : null);
    });
  });
}

/**
 * Each chunk is its own WAV file. To play seamlessly we strip the 44-byte header
 * from all chunks except the first, then re-emit as one base64 string.
 * If chunk decoding fails for any reason, just return the first chunk.
 */
function mergeWavBase64(chunks: string[]): string {
  try {
    if (chunks.length === 1) return chunks[0];
    const decoded = chunks.map((b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0)));
    const head = decoded[0];
    const bodies = decoded.slice(1).map((b) => b.subarray(44));
    const totalDataLen =
      head.byteLength - 44 + bodies.reduce((acc, b) => acc + b.byteLength, 0);
    const out = new Uint8Array(44 + totalDataLen);
    out.set(head.subarray(0, 44), 0);
    // Patch RIFF size (bytes 4-7) and data chunk size (bytes 40-43)
    const view = new DataView(out.buffer);
    view.setUint32(4, 36 + totalDataLen, true);
    view.setUint32(40, totalDataLen, true);
    let offset = 44;
    out.set(head.subarray(44), offset);
    offset += head.byteLength - 44;
    for (const b of bodies) {
      out.set(b, offset);
      offset += b.byteLength;
    }
    let bin = "";
    for (let i = 0; i < out.byteLength; i++) bin += String.fromCharCode(out[i]);
    return btoa(bin);
  } catch {
    return chunks[0];
  }
}

export const voiceQuery = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { transcript: string; sections: Record<string, string> }) => {
      if (!input?.transcript?.trim()) throw new Error("transcript is required");
      if (!input.sections || typeof input.sections !== "object") {
        throw new Error("sections is required");
      }
      return {
        transcript: input.transcript.slice(0, 1000),
        sections: input.sections,
      };
    },
  )
  .handler(async ({ data }): Promise<VoiceQueryResult> => {
    const plan = await classify(data.transcript, data.sections);
    const tts = await synthesize(plan.spokenText);
    return {
      transcript: data.transcript,
      ...plan,
      audioBase64: tts.audio,
      audioMime: "audio/wav",
      ttsError: tts.error,
    };
  });
