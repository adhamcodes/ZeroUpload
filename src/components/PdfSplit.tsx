import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  getPdfPageCount,
  extractRange,
  splitToPages,
  type PdfToolResult,
} from "../lib/pdfTools";

type Mode = "range" | "single";
interface Output {
  url: string;
  name: string;
  bytes: number;
}

const MAX_BYTES = 100 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("range");
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("1");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState<Output[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputsRef = useRef<Output[]>([]);
  outputsRef.current = outputs;

  const clearOutputs = useCallback(() => {
    outputsRef.current.forEach((o) => URL.revokeObjectURL(o.url));
    setOutputs([]);
  }, []);

  const loadFile = useCallback(
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
      clearOutputs();
      setFile(f);
      setPages(null);
      try {
        const count = await getPdfPageCount(f);
        setPages(count);
        setFrom("1");
        setTo(String(count));
      } catch {
        setError("Couldn't read that PDF — is it valid?");
        setFile(null);
      }
    },
    [clearOutputs],
  );

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      void loadFile(list[0]);
    },
    [loadFile],
  );

  const reset = useCallback(() => {
    clearOutputs();
    setFile(null);
    setPages(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, [clearOutputs]);

  const run = useCallback(async () => {
    if (!file || pages === null) return;
    setError("");
    setBusy(true);
    clearOutputs();
    try {
      if (mode === "range") {
        const f = Math.max(1, Math.min(Number(from) || 1, pages));
        const t = Math.max(1, Math.min(Number(to) || pages, pages));
        const res: PdfToolResult = await extractRange(file, f, t);
        setOutputs([{ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size }]);
      } else {
        const results = await splitToPages(file);
        setOutputs(results.map((r) => ({ url: URL.createObjectURL(r.blob), name: r.filename, bytes: r.blob.size })));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't split that PDF.");
    } finally {
      setBusy(false);
    }
  }, [file, pages, mode, from, to, clearOutputs]);

  useEffect(() => {
    return () => {
      outputsRef.current.forEach((o) => URL.revokeObjectURL(o.url));
    };
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

  const onNum = (setter: (v: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value.replace(/[^0-9]/g, ""));
    clearOutputs();
  };

  if (!file) {
    return (
      <div className="w-full">
        <div
          role="button"
          tabIndex={0}
          aria-label="Add a PDF to split"
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
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your PDF here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — split on your device</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
          Nothing is uploaded. Your PDF never leaves this browser.
        </p>
        {error && (
          <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* file header */}
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 sm:p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-stone">
            {prettyBytes(file.size)}
            {pages !== null && ` · ${pages} pages`}
          </p>
        </div>
        <button
          onClick={reset}
          className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Change
        </button>
      </div>

      {/* mode toggle */}
      <div className="mt-5 inline-flex rounded-full border border-mist bg-surface-1 p-1 text-sm">
        <button
          onClick={() => {
            setMode("range");
            clearOutputs();
          }}
          className={["rounded-full px-4 py-1.5 transition-colors", mode === "range" ? "bg-accent text-canvas" : "text-stone hover:text-ink"].join(" ")}
        >
          Extract a range
        </button>
        <button
          onClick={() => {
            setMode("single");
            clearOutputs();
          }}
          className={["rounded-full px-4 py-1.5 transition-colors", mode === "single" ? "bg-accent text-canvas" : "text-stone hover:text-ink"].join(" ")}
        >
          Split to single pages
        </button>
      </div>

      {mode === "range" && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block font-display text-sm font-medium text-ink">From page</label>
            <input
              type="text"
              inputMode="numeric"
              value={from}
              onChange={onNum(setFrom)}
              className="w-24 rounded-[var(--radius-md)] border border-mist bg-surface-1 px-3 py-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-display text-sm font-medium text-ink">To page</label>
            <input
              type="text"
              inputMode="numeric"
              value={to}
              onChange={onNum(setTo)}
              className="w-24 rounded-[var(--radius-md)] border border-mist bg-surface-1 px-3 py-3 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
          {pages !== null && <p className="pb-3 text-xs text-stone">of {pages} pages</p>}
        </div>
      )}
      {mode === "single" && (
        <p className="mt-4 text-sm text-stone">
          Splits the PDF into {pages ?? "—"} separate one-page PDFs, each downloadable below.
        </p>
      )}

      <div className="mt-5">
        {outputs.length === 0 ? (
          <button
            onClick={run}
            disabled={busy}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Splitting…" : mode === "range" ? "Extract pages" : "Split into pages"}
          </button>
        ) : mode === "range" ? (
          <a
            href={outputs[0].url}
            download={outputs[0].name}
            className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
          >
            Download · {prettyBytes(outputs[0].bytes)}
          </a>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-stone">{outputs.length} pages ready:</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {outputs.map((o, i) => (
                <a
                  key={i}
                  href={o.url}
                  download={o.name}
                  className="animate-card-in flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-mist bg-surface-1 px-3 py-2 text-sm text-ink transition-colors hover:border-accent"
                  style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
                >
                  <span>Page {i + 1}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="text-accent">
                    <path d="M12 15V3" /><path d="m6 11 6 6 6-6" /><path d="M4 21h16" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
    </div>
  );
}
