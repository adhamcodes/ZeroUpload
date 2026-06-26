import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { mergeAudio } from "../lib/engines/audio";

const ACCEPT = ".mp3,.wav,.ogg,.m4a,.flac,.aac,audio/*";
const MAX_BYTES = 200 * 1024 * 1024;
const FORMATS = ["mp3", "wav", "ogg", "m4a", "flac", "aac"];

interface Track {
  id: string;
  file: File;
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;

export default function AudioMerge() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [target, setTarget] = useState("mp3");
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

  const addFiles = useCallback((list: FileList | null) => {
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) { setError(`"${tooBig.name}" is too large (limit ${prettyBytes(MAX_BYTES)}).`); return; }
    setError("");
    clearResult();
    setTracks((prev) => [...prev, ...incoming.map((file) => ({ id: `a${++seq}`, file }))]);
  }, [clearResult]);

  const removeTrack = useCallback((id: string) => { setTracks((prev) => prev.filter((t) => t.id !== id)); clearResult(); }, [clearResult]);

  const move = useCallback((from: number, to: number) => {
    setTracks((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [t] = next.splice(from, 1);
      next.splice(to, 0, t);
      return next;
    });
    clearResult();
  }, [clearResult]);

  const reset = useCallback(() => {
    clearResult();
    setTracks([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const run = useCallback(async () => {
    if (tracks.length < 2) { setError("Add at least two audio files to merge."); return; }
    setBusy(true); setError(""); setStatus("Starting…"); clearResult();
    try {
      const res = await mergeAudio(tracks.map((t) => t.file), target, (_r, label) => setStatus(label));
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't merge these files.");
    } finally {
      setBusy(false); setStatus("");
    }
  }, [tracks, target, clearResult]);

  useEffect(() => () => { if (resRef.current?.url) URL.revokeObjectURL(resRef.current.url); }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  return (
    <div className="w-full">
      <div role="button" tabIndex={0} aria-label="Add audio files to merge" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
        className={["relative flex w-full cursor-pointer flex-col items-center justify-center text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", tracks.length ? "px-6 py-8" : "px-8 py-16", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
        <div className={["flex items-center justify-center rounded-full bg-accent-soft text-accent", tracks.length ? "mb-2 h-9 w-9" : "mb-4 h-12 w-12"].join(" ")}>
          <svg width={tracks.length ? 18 : 22} height={tracks.length ? 18 : 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
        </div>
        <p className={["font-display text-ink", tracks.length ? "text-base" : "text-xl"].join(" ")}>{tracks.length ? "Add more audio" : "Drop your audio files here"}</p>
        {!tracks.length && <p className="mt-1 text-sm text-stone">or click to choose — merged on your device, in order</p>}
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
        <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
        Nothing is uploaded. Your audio never leaves this browser.
      </p>

      {tracks.length > 0 && (
        <>
          <ul className="mt-5 space-y-2">
            {tracks.map((t, idx) => (
              <li key={t.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-mist bg-surface-2 px-3 py-2.5">
                <span className="font-mono text-xs text-stone">{idx + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{t.file.name}</p>
                  <p className="text-xs text-stone">{prettyBytes(t.file.size)}</p>
                </div>
                <button onClick={() => move(idx, idx - 1)} disabled={idx === 0} aria-label="Move up" className="rounded p-1 text-stone transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
                </button>
                <button onClick={() => move(idx, idx + 1)} disabled={idx === tracks.length - 1} aria-label="Move down" className="rounded p-1 text-stone transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <button onClick={() => removeTrack(t.id)} aria-label="Remove" className="rounded p-1 text-stone transition-colors hover:bg-danger/10 hover:text-danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center gap-3">
            <label htmlFor="merge-format" className="text-sm text-stone">Output format</label>
            <select id="merge-format" value={target} onChange={(e) => { setTarget(e.target.value); clearResult(); }} className="rounded-[var(--radius-md)] border border-mist bg-surface-1 px-3 py-1.5 text-sm text-ink">
              {FORMATS.map((f) => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
            <button onClick={reset} className="ml-auto text-sm text-stone underline-offset-4 hover:text-ink hover:underline">Clear all</button>
          </div>

          <p className="mt-3 text-xs text-stone">Files are joined end-to-end in the order above and re-encoded to {target.toUpperCase()}, so they play as one seamless track even if the originals differ.</p>
        </>
      )}

      {busy && <p className="mt-4 text-sm text-accent">{status || "Working…"}</p>}
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      {tracks.length > 0 && (
        <div className="mt-6">
          {result ? (
            <div className="flex flex-wrap items-center gap-3">
              <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">Download · {prettyBytes(result.bytes)}</a>
              <button onClick={clearResult} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">Merge again</button>
            </div>
          ) : (
            <button onClick={run} disabled={busy || tracks.length < 2} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40">{busy ? "Merging…" : "Merge & download"}</button>
          )}
        </div>
      )}
    </div>
  );
}
