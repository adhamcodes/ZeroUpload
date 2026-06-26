import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { trimAudio, getAudioDuration } from "../lib/engines/audio";

const ACCEPT = ".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/*";
const MAX_BYTES = 200 * 1024 * 1024;

function fmt(t: number): string {
  if (!Number.isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AudioTrim() {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState(0);
  const [startT, setStartT] = useState(0);
  const [endT, setEndT] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; bytes: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resRef = useRef<{ url: string } | null>(null);
  const prevRef = useRef<string | null>(null);
  resRef.current = result;
  prevRef.current = previewUrl;

  const clearResult = useCallback(() => {
    if (resRef.current?.url) URL.revokeObjectURL(resRef.current.url);
    setResult(null);
  }, []);

  const load = useCallback(
    async (f: File) => {
      if (f.size > MAX_BYTES) {
        setError(`That file is ${prettyBytes(f.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`);
        return;
      }
      setError("");
      clearResult();
      if (prevRef.current) URL.revokeObjectURL(prevRef.current);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setFile(f);
      try {
        const d = await getAudioDuration(f);
        setDuration(d);
        setStartT(0);
        setEndT(d);
      } catch {
        setDuration(0);
        setEndT(0);
        setError("Couldn't read this audio file — is it a valid audio format?");
      }
    },
    [clearResult],
  );

  const addFiles = useCallback((list: FileList | null) => { if (list && list[0]) void load(list[0]); }, [load]);

  const reset = useCallback(() => {
    clearResult();
    if (prevRef.current) URL.revokeObjectURL(prevRef.current);
    setPreviewUrl(null);
    setFile(null);
    setDuration(0);
    setStartT(0);
    setEndT(0);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const run = useCallback(async () => {
    if (!file) return;
    if (endT - startT < 0.05) {
      setError("The end must be after the start.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Starting…");
    clearResult();
    try {
      const res = await trimAudio(file, startT, endT, (_r, label) => setStatus(label));
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't trim this audio.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }, [file, startT, endT, clearResult]);

  useEffect(() => () => {
    if (resRef.current?.url) URL.revokeObjectURL(resRef.current.url);
    if (prevRef.current) URL.revokeObjectURL(prevRef.current);
  }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  if (!file) {
    return (
      <div className="w-full">
        <div role="button" tabIndex={0} aria-label="Add an audio file to trim" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={["relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your audio here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — trimmed on your device</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
          Nothing is uploaded. Your audio never leaves this browser.
        </p>
        {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 sm:p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-stone">{prettyBytes(file.size)} · {fmt(duration)} long</p>
        </div>
        <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">Change</button>
      </div>

      {previewUrl && <audio src={previewUrl} controls className="mt-4 w-full" />}

      {duration > 0 && (
        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-xs text-stone"><span>Start</span><span className="font-mono">{fmt(startT)}</span></div>
            <input type="range" min={0} max={duration} step={0.1} value={startT}
              onChange={(e) => { const v = Math.min(parseFloat(e.target.value), endT - 0.1); setStartT(Math.max(0, v)); clearResult(); }}
              className="w-full accent-[var(--accent)]" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs text-stone"><span>End</span><span className="font-mono">{fmt(endT)}</span></div>
            <input type="range" min={0} max={duration} step={0.1} value={endT}
              onChange={(e) => { const v = Math.max(parseFloat(e.target.value), startT + 0.1); setEndT(Math.min(duration, v)); clearResult(); }}
              className="w-full accent-[var(--accent)]" />
          </div>
          <p className="text-sm text-stone">Keeping <span className="font-mono text-ink">{fmt(endT - startT)}</span> · lossless, same format.</p>
        </div>
      )}

      {busy && <p className="mt-4 text-sm text-accent">{status || "Working…"}</p>}
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      <div className="mt-6">
        {result ? (
          <div className="flex flex-wrap items-center gap-3">
            <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">Download · {prettyBytes(result.bytes)}</a>
            <button onClick={clearResult} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">Trim again</button>
          </div>
        ) : (
          <button onClick={run} disabled={busy || duration <= 0} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40">{busy ? "Trimming…" : "Trim & download"}</button>
        )}
      </div>
    </div>
  );
}
