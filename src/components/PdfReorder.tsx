import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { renderPdfThumbnails, reorderPdf } from "../lib/pdfTools";

const MAX_BYTES = 100 * 1024 * 1024;

interface PageItem {
  orig: number; // 0-based index in the source PDF
  thumb: string;
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfReorder() {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<PageItem[]>([]);
  const [loadingThumbs, setLoadingThumbs] = useState(false);
  const [thumbProgress, setThumbProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; bytes: number; pages: number } | null>(null);

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
      setError(""); clearResult(); setFile(f); setItems([]); setLoadingThumbs(true); setThumbProgress(0);
      try {
        const thumbs = await renderPdfThumbnails(f, { onProgress: (r) => setThumbProgress(Math.round(r * 100)) });
        setItems(thumbs.map((thumb, orig) => ({ orig, thumb })));
      } catch {
        setError("Couldn't read that PDF — is it valid?"); setFile(null);
      } finally {
        setLoadingThumbs(false);
      }
    },
    [clearResult],
  );

  const addFiles = useCallback((list: FileList | null) => { if (list && list[0]) void load(list[0]); }, [load]);

  const reset = useCallback(() => {
    clearResult(); setFile(null); setItems([]); setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const move = useCallback((from: number, to: number) => {
    setItems((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
    clearResult();
  }, [clearResult]);

  const remove = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    clearResult();
  }, [clearResult]);

  const run = useCallback(async () => {
    if (!file || items.length === 0) return;
    setBusy(true); setError(""); clearResult();
    try {
      const res = await reorderPdf(file, items.map((it) => it.orig));
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size, pages: res.pages ?? items.length });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't rebuild that PDF.");
    } finally { setBusy(false); }
  }, [file, items, clearResult]);

  useEffect(() => () => { if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url); }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  if (!file) {
    return (
      <div className="w-full">
        <div role="button" tabIndex={0} aria-label="Add a PDF to reorder" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={["relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your PDF here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — reordered on your device</p>
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
          <p className="text-xs text-stone">{prettyBytes(file.size)}{items.length > 0 && ` · ${items.length} page${items.length === 1 ? "" : "s"} kept`}</p>
        </div>
        <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">Change</button>
      </div>

      {loadingThumbs && (
        <div className="mt-6">
          <p className="mb-2 text-sm text-stone">Rendering pages… {thumbProgress}%</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist">
            <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.max(4, thumbProgress)}%` }} />
          </div>
        </div>
      )}

      {!loadingThumbs && items.length > 0 && (
        <>
          <p className="mt-5 mb-3 text-sm text-stone">Drag isn't needed — use the arrows to reorder and the ✕ to delete a page. The new order is what you'll download.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((it, idx) => (
              <div key={it.orig} className="group relative overflow-hidden rounded-[var(--radius-md)] border border-mist bg-surface-1">
                <img src={it.thumb} alt={`Page ${it.orig + 1}`} className="block w-full bg-white object-contain" />
                <div className="flex items-center justify-between gap-1 border-t border-mist px-2 py-1.5">
                  <span className="text-xs text-stone">#{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => move(idx, idx - 1)} disabled={idx === 0} aria-label="Move earlier" className="rounded p-1 text-stone transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button onClick={() => move(idx, idx + 1)} disabled={idx === items.length - 1} aria-label="Move later" className="rounded p-1 text-stone transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                    <button onClick={() => remove(idx)} aria-label="Delete page" className="rounded p-1 text-stone transition-colors hover:bg-danger/10 hover:text-danger">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {result ? (
              <div className="flex flex-wrap items-center gap-3">
                <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">
                  Download · {result.pages} page{result.pages === 1 ? "" : "s"} · {prettyBytes(result.bytes)}
                </a>
                <button onClick={clearResult} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">Keep editing</button>
              </div>
            ) : (
              <button onClick={run} disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40">
                {busy ? "Building…" : "Apply & download"}
              </button>
            )}
          </div>
        </>
      )}

      {!loadingThumbs && items.length === 0 && file && !error && (
        <div className="mt-5 rounded-[var(--radius-md)] border border-brass/30 bg-brass-soft px-4 py-3 text-sm text-brass">You've deleted every page. Add at least one back (reload the file with "Change") to download.</div>
      )}
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
    </div>
  );
}
