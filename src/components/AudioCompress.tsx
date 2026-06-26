import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { compressAudio } from "../lib/engines/audio";

const ACCEPT = ".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/*";
const MAX_BYTES = 200 * 1024 * 1024;

const PRESETS = [
  { label: "High (192 kbps)", kbps: 192, note: "Great quality, modest savings" },
  { label: "Balanced (128 kbps)", kbps: 128, note: "Good quality, smaller file" },
  { label: "Small (96 kbps)", kbps: 96, note: "Noticeably smaller, fair quality" },
  { label: "Tiny (64 kbps)", kbps: 64, note: "Smallest, voice-grade quality" },
];

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AudioCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [kbps, setKbps] = useState(128);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; bytes: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resRef = useRef<{ url: string } | null>(null);
  resRef.current = result;

  const clearResult = useCallback(() => {
    if (resRef.current?.url) URL.revokeObjectURL(resRef.current.url);
    setResult(null);
  }, []);

  const load = useCallback((f: File) => {
    if (f.size > MAX_BYTES) { setError(`That file is ${prettyBytes(f.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`); return; }
    setError("");
    clearResult();
    setFile(f);
  }, [clearResult]);

  const addFiles = useCallback((list: FileList | null) => { if (list && list[0]) load(list[0]); }, [load]);

  const reset = useCallback(() => {
    clearResult();
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const run = useCallback(async () => {
    if (!file) return;
    setBusy(true); setError(""); setStatus("Starting…"); clearResult();
    try {
      const res = await compressAudio(file, kbps, (_r, label) => setStatus(label));
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't compress this audio.");
    } finally {
      setBusy(false); setStatus("");
    }
  }, [file, kbps, clearResult]);

  useEffect(() => () => { if (resRef.current?.url) URL.revokeObjectURL(resRef.current.url); }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  if (!file) {
    return (
      <div className="w-full">
        <div role="button" tabIndex={0} aria-label="Add an audio file to compress" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={["relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your audio here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — compressed on your device</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
          Nothing is uploaded. Your audio never leaves this browser.
        </p>
        {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      </div>
    );
  }

  const savings = result ? Math.max(0, Math.round((1 - result.bytes / file.size) * 100)) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 sm:p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-stone">{prettyBytes(file.size)}</p>
        </div>
        <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">Change</button>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-ink">Quality</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRESETS.map((p) => (
            <label key={p.kbps} className={["flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 transition-colors", kbps === p.kbps ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent/50"].join(" ")}>
              <input type="radio" name="kbps" className="mt-1 accent-[var(--accent)]" checked={kbps === p.kbps} onChange={() => { setKbps(p.kbps); clearResult(); }} />
              <span>
                <span className="block text-sm font-medium text-ink">{p.label}</span>
                <span className="block text-xs text-stone">{p.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-3 rounded-[var(--radius-md)] border border-brass/30 bg-brass-soft px-4 py-3 text-sm text-brass">
        Compressing re-encodes to MP3 and is lossy — the file gets smaller but a little audio detail is lost. Best for sharing voice notes, podcasts and music where size matters more than studio fidelity.
      </p>

      {busy && <p className="mt-4 text-sm text-accent">{status || "Working…"}</p>}
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="mt-6">
        {result ? (
          <div className="flex flex-wrap items-center gap-3">
            <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">
              Download MP3 · {prettyBytes(result.bytes)}{savings > 0 ? ` · ${savings}% smaller` : ""}
            </a>
            <button onClick={clearResult} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">Try another quality</button>
          </div>
        ) : (
          <button onClick={run} disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40">{busy ? "Compressing…" : "Compress & download"}</button>
        )}
      </div>
    </div>
  );
}
