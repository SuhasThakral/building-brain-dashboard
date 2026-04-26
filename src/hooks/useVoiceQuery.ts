import { useCallback, useEffect, useRef, useState } from "react";
import { voiceQuery, type VoiceQueryResult } from "@/server/voice.functions";
import type { SectionKey } from "@/data/mockData";

export type VoiceState =
  | "idle"
  | "recording"
  | "thinking"
  | "answering"
  | "error";

interface UseVoiceQueryArgs {
  getSections: () => Record<SectionKey, string>;
  patchSection: (section: SectionKey, line: string) => void;
}

// Browser SpeechRecognition typings (minimal)
type SR = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceQuery({ getSections, patchSection }: UseVoiceQueryArgs) {
  const [state, setState] = useState<VoiceState>("idle");
  const [result, setResult] = useState<VoiceQueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interim, setInterim] = useState<string>("");
  const recognitionRef = useRef<SR | null>(null);
  const transcriptRef = useRef<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const supported = !!getSpeechRecognition();

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
      audioRef.current?.pause();
    };
  }, []);

  const dismiss = useCallback(() => {
    setResult(null);
    setErrorMsg(null);
    setInterim("");
    setState("idle");
    audioRef.current?.pause();
  }, []);

  const runQuery = useCallback(
    async (transcript: string) => {
      setState("thinking");
      try {
        const data = await voiceQuery({
          data: { transcript, sections: getSections() },
        });
        setResult(data);
        setState("answering");

        if (data.type === "statement" && data.patchedSection && data.patchLine) {
          patchSection(data.patchedSection as SectionKey, data.patchLine);
        }

        if (data.audioBase64) {
          const audio = new Audio(`data:${data.audioMime};base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.play().catch(() => {
            // Autoplay blocked — that's fine, we still show the text panel
          });
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          // Fallback to browser TTS so the user still hears something
          const u = new SpeechSynthesisUtterance(data.spokenText);
          u.rate = 1.05;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Voice query failed";
        setErrorMsg(msg);
        setState("error");
      }
    },
    [getSections, patchSection],
  );

  const startRecording = useCallback(() => {
    console.log("[voice] startRecording, state =", state);
    if (state === "recording" || state === "thinking") {
      // Toggle off if already recording
      if (state === "recording") {
        try {
          recognitionRef.current?.stop();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    const SRClass = getSpeechRecognition();
    if (!SRClass) {
      setErrorMsg(
        "Voice input not supported in this browser. Use Chrome, Edge, or Safari.",
      );
      setState("error");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setErrorMsg("Microphone requires HTTPS. Open the published URL.");
      setState("error");
      return;
    }
    setResult(null);
    setErrorMsg(null);
    setInterim("");
    transcriptRef.current = "";

    const rec = new SRClass();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true; // keep listening until the user clicks stop
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i] as ArrayLike<{ transcript: string }> & {
          isFinal?: boolean;
        };
        const txt = r[0]?.transcript ?? "";
        if ((r as { isFinal?: boolean }).isFinal) {
          finalText += txt + " ";
        } else {
          interimText += txt;
        }
      }
      if (finalText) transcriptRef.current += finalText;
      setInterim((transcriptRef.current + " " + interimText).trim());
      console.log("[voice] result, transcript so far:", transcriptRef.current);
    };
    rec.onerror = (e) => {
      console.warn("[voice] onerror:", e.error);
      if (e.error === "no-speech" || e.error === "aborted") {
        setState("idle");
        return;
      }
      const friendly =
        e.error === "not-allowed"
          ? "Microphone permission denied. Allow it in your browser settings."
          : e.error === "audio-capture"
            ? "No microphone found."
            : e.error === "network"
              ? "Speech recognition needs internet (Chrome sends audio to Google)."
              : `Mic error: ${e.error}`;
      setErrorMsg(friendly);
      setState("error");
    };
    rec.onend = () => {
      console.log(
        "[voice] onend, final transcript:",
        transcriptRef.current,
      );
      const final = transcriptRef.current.trim();
      if (!final) {
        setState((s) => (s === "error" ? s : "idle"));
        return;
      }
      void runQuery(final);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setState("recording");
      console.log("[voice] recognition started");
    } catch (err) {
      console.error("[voice] start failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Could not start mic");
      setState("error");
    }
  }, [state, runQuery]);

  const stopRecording = useCallback(() => {
    console.log("[voice] stopRecording called");
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
  }, []);

  return {
    state,
    result,
    errorMsg,
    interim,
    supported,
    startRecording,
    stopRecording,
    dismiss,
  };
}
