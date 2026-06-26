import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { rotatePdf, getPdfPageCount } from "../lib/pdfTools";

const MAX_BYTES = 100 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const OPTIONS: { label: string; turn: 90 | 180 | 270 }[] = [
  { label: "90° left", turn: 270 },
  { label: "90° right", turn: 90 },
  { label: "180°", turn: 180 },
];

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [turn, setTurn] = useState<90 | 180 | 270>(90);
  const [busy, setBusy] = useState(false);
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
      if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") {
        setError("Please choose a PDF file.");
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(`That PDF is ${prettyBytes(f.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`);
        return;
      }
      setError("");
      clearResult();
      setFile(f);
      setPages(null);
      try {
        setPages(await getPdfPageCount(f));
      } catch {
        setError("Couldn't read that PDF — is it valid?");
        setFile(null);
      }
    },
    [clearResult],
  );

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (list && list.length > 0) void load(list[0]);
    },
    [load],
  );

  const reset = useCallback(() => {
    clearResult();
    setFile(null);
    setPages(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const run = useCallback(async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    clearResult();
    try {
      const res = await rotatePdf(file, turn);
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't rotate that PDF.");
    } finally {
      setBusy(false);
    }
  }, [file, turn, clearResult]);

  useEffect(() => () => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  if (!file) {
    return (
      <div className="w-full">
        <div
          role="button"
          tabIndex={0}
          aria-label="Add a PDF to rotate"
          onClick={() => inputRef.current?.click()}
          onKeyDown={onKey}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={[
            "relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center",
            "rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200",
            dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent",
          ].join(" ")}
        >
          <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your PDF here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — rotated on your device</p>
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

      <p className="mt-5 mb-2 font-display text-sm font-medium text-ink">Rotate every page</p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.turn}
            onClick={() => { setTurn(o.turn); clearResult(); }}
            className={[
              "rounded-full border px-4 py-2 text-sm transition-colors",
              turn === o.turn ? "border-accent bg-accent-soft text-accent" : "border-mist bg-surface-1 text-stone hover:text-ink hover:border-accent/60",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {result ? (
          <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">
            Download rotated PDF · {prettyBytes(result.bytes)}
          </a>
        ) : (
          <button onClick={run} disabled={busy} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40">
            {busy ? "Rotating…" : "Rotate PDF"}
          </button>
        )}
      </div>
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
    </div>
  );
}
