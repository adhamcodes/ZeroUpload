import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { compressPdf, getPdfPageCount } from "../lib/pdfTools";

const MAX_BYTES = 100 * 1024 * 1024;
const PRESETS = [
  { id: "high", name: "High quality", quality: 0.82, scale: 2 },
  { id: "balanced", name: "Balanced", quality: 0.65, scale: 1.5 },
  { id: "small", name: "Smallest", quality: 0.5, scale: 1.2 },
];

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfCompress() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [preset, setPreset] = useState("balanced");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; bytes: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<{ url: string } | null>(null);
  resultRef.current = result;

  const clearResult = useCallback(() => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
    setResult(null);
  }, []);

  const load = useCallback(
    async (f: File) => {
      if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") { setError("Please choose a PDF file."); return; }
      if (f.size > MAX_BYTES) { setError(`That PDF is ${prettyBytes(f.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`); return; }
      setError(""); clearResult(); setFile(f); setPages(null);
      try { setPages(await getPdfPageCount(f)); } catch { setError("Couldn't read that PDF — is it valid?"); setFile(null); }
    },
    [clearResult],
  );

  const addFiles = useCallback((list: FileList | null) => { if (list && list[0]) void load(list[0]); }, [load]);

  const reset = useCallback(() => {
    clearResult(); setFile(null); setPages(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const run = useCallback(async () => {
    if (!file) return;
    const p = PRESETS.find((x) => x.id === preset)!;
    setBusy(true); setError(""); setProgress(0); clearResult();
    try {
      const res = await compressPdf(file, { quality: p.quality, scale: p.scale, onProgress: (r) => setProgress(Math.round(r * 100)) });
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't compress that PDF.");
    } finally { setBusy(false); }
  }, [file, preset, clearResult]);

  useEffect(() => () => { if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url); }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  const savedPct = result && file && file.size > 0 ? Math.round((1 - result.bytes / file.size) * 100) : null;

  if (!file) {
    return (
      <div className="w-full">
        <div role="button" tabIndex={0} aria-label="Add a PDF to compress" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={["relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your PDF here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — compressed on your device</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
          Nothing is uploaded. Your PDF never leaves this browser.
        </p>
        {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 sm:p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-stone">{prettyBytes(file.size)}{pages !== null && ` · ${pages} pages`}</p>
        </div>
        <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">Change</button>
      </div>

      {/* Honest quality warning */}
      <div className="mt-4 rounded-[var(--radius-md)] border border-brass/30 bg-brass-soft px-4 py-3 text-sm text-brass">
        ⚠️ Light compression flattens each page to an image. Great for scans &amp; image-heavy PDFs, but the text will no longer be selectable or searchable. For text PDFs, this may not shrink much.
      </div>

      <p className="mt-5 mb-2 font-display text-sm font-medium text-ink">Compression level</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => { setPreset(p.id); clearResult(); }}
            className={["rounded-full border px-4 py-2 text-sm transition-colors", preset === p.id ? "border-accent bg-accent-soft text-accent" : "border-mist bg-surface-1 text-stone hover:text-ink hover:border-accent/60"].join(" ")}>
            {p.name}
          </button>
        ))}
      </div>

      {busy && (
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-mist">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.max(4, progress)}%` }} />
        </div>
      )}

      <div className="mt-5">
        {result ? (
          <div className="flex flex-wrap items-center gap-3">
            <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">
              Download · {prettyBytes(result.bytes)}
            </a>
            <span className="font-mono text-sm text-stone">
              {prettyBytes(file.size)} <span className="text-faint">→</span> {prettyBytes(result.bytes)}
              {savedPct !== null && savedPct > 0 && <span className="ml-1 font-semibold text-accent">({savedPct}% smaller)</span>}
              {savedPct !== null && savedPct <= 0 && <span className="ml-1 text-brass">(no gain — already optimal / text PDF)</span>}
            </span>
          </div>
        ) : (
          <button onClick={run} disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40">
            {busy ? `Compressing… ${progress}%` : "Compress PDF"}
          </button>
        )}
      </div>
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
    </div>
  );
}
