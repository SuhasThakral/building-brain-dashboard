import { useCallback, useEffect, useRef, useState } from "react";
import {
  voiceQuery,
  transcribeAudio,
  type VoiceQueryResult,
} from "@/server/voice.functions";
import type { SectionKey } from "@/data/mockData";

export type VoiceState =
  | "idle"
  | "recording"
  | "transcribing"
  | "thinking"
  | "answering"
  | "error";

interface UseVoiceQueryArgs {
  getSections: () => Record<SectionKey, string>;
  patchSection: (section: SectionKey, line: string) => void;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function useVoiceQuery({ getSections, patchSection }: UseVoiceQueryArgs) {
  const [state, setState] = useState<VoiceState>("idle");
  const [result, setResult] = useState<VoiceQueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [interim, setInterim] = useState<string>("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>("audio/webm");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const supported =
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof MediaRecorder !== "undefined";

  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
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
        console.log("[voice] sending to server, transcript:", transcript);
        const data = await voiceQuery({
          data: { transcript, sections: getSections() },
        });
        console.log("[voice] server reply:", data.type, data.spokenText);
        setResult(data);
        setState("answering");

        if (data.type === "statement" && data.patchedSection && data.patchLine) {
          patchSection(data.patchedSection as SectionKey, data.patchLine);
        }

        if (data.audioBase64) {
          const audio = new Audio(`data:${data.audioMime};base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.play().catch(() => {
            // Autoplay blocked — fall back to browser TTS
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              const u = new SpeechSynthesisUtterance(data.spokenText);
              u.rate = 1.05;
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(u);
            }
          });
        } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(data.spokenText);
          u.rate = 1.05;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } catch (err) {
        console.error("[voice] runQuery failed", err);
        const msg = err instanceof Error ? err.message : "Voice query failed";
        setErrorMsg(msg);
        setState("error");
      }
    },
    [getSections, patchSection],
  );

  const finalizeRecording = useCallback(async () => {
    const blob = new Blob(chunksRef.current, { type: mimeRef.current });
    chunksRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (blob.size < 600) {
      console.warn("[voice] audio blob too small, ignoring", blob.size);
      setState("idle");
      return;
    }

    setState("transcribing");
    try {
      const base64 = await blobToBase64(blob);
      console.log(
        "[voice] transcribing audio, bytes:",
        blob.size,
        "mime:",
        mimeRef.current,
      );
      const { transcript } = await transcribeAudio({
        data: { base64, mimeType: mimeRef.current },
      });
      console.log("[voice] transcript:", transcript);
      const trimmed = transcript.trim();
      setInterim(trimmed);
      if (!trimmed) {
        setErrorMsg("No speech detected. Try again, speak a little louder.");
        setState("error");
        return;
      }
      await runQuery(trimmed);
    } catch (err) {
      console.error("[voice] transcription failed", err);
      setErrorMsg(err instanceof Error ? err.message : "Transcription failed");
      setState("error");
    }
  }, [runQuery]);

  const startRecording = useCallback(async () => {
    console.log("[voice] startRecording, state =", state);

    // Toggle off if already recording
    if (state === "recording") {
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    if (state === "transcribing" || state === "thinking") return;

    if (!supported) {
      setErrorMsg(
        "Voice input not supported in this browser. Try Chrome, Edge, or Safari.",
      );
      setState("error");
      return;
    }
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setErrorMsg("Microphone requires HTTPS.");
      setState("error");
      return;
    }

    setResult(null);
    setErrorMsg(null);
    setInterim("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMimeType();
      mimeRef.current = mime || "audio/webm";
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        console.log("[voice] recorder stopped, chunks:", chunksRef.current.length);
        void finalizeRecording();
      };
      recorder.onerror = (e) => {
        console.error("[voice] recorder error", e);
        setErrorMsg("Recording error");
        setState("error");
      };
      recorder.start(250);
      recorderRef.current = recorder;
      setState("recording");
      console.log("[voice] recording started, mime =", mimeRef.current);
    } catch (err) {
      console.error("[voice] getUserMedia failed", err);
      const e = err as { name?: string; message?: string };
      const friendly =
        e.name === "NotAllowedError"
          ? "Microphone permission denied. Allow it in your browser, then reload."
          : e.name === "NotFoundError"
            ? "No microphone found on this device."
            : e.name === "NotReadableError"
              ? "Microphone is in use by another app."
              : `Could not access microphone: ${e.message ?? "unknown"}`;
      setErrorMsg(friendly);
      setState("error");
    }
  }, [state, supported, finalizeRecording]);

  const stopRecording = useCallback(() => {
    console.log("[voice] stopRecording called, state =", state);
    try {
      recorderRef.current?.stop();
    } catch {
      // ignore
    }
  }, [state]);

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
