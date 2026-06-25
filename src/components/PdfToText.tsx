import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { extractText } from "../lib/pdfTools";

const MAX_BYTES = 100 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdfToText() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [pages, setPages] = useState(0);
  const [empty, setEmpty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [txtUrl, setTxtUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
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
      setFile(f);
      setText("");
      setEmpty(false);
      setBusy(true);
      setProgress(0);
      try {
        const res = await extractText(f, (r) => setProgress(Math.round(r * 100)));
        setText(res.text);
        setPages(res.pages);
        setEmpty(res.empty);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't read that PDF.");
        setFile(null);
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (list && list.length > 0) void handle(list[0]);
    },
    [handle],
  );

  const reset = useCallback(() => {
    setFile(null);
    setText("");
    setError("");
    setPages(0);
    setEmpty(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy — your browser blocked clipboard access.");
    }
  }, [text]);

  const downloadName = file ? `${file.name.replace(/\.[^.]+$/, "") || "document"}.txt` : "document.txt";

  // Manage the .txt download URL alongside the extracted text.
  useEffect(() => {
    if (!text) {
      setTxtUrl(null);
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    setTxtUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [text]);

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

  return (
    <div className="w-full">
      {!file ? (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Add a PDF to extract text"
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
                <path d="M9 13h6" /><path d="M9 17h4" />
              </svg>
            </div>
            <p className="font-display text-xl text-ink">Drop your PDF here</p>
            <p className="mt-1 text-sm text-stone">or click to choose — text extracted on your device</p>
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
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 sm:p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-accent-soft text-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-stone">
                {prettyBytes(file.size)}
                {busy ? ` · extracting ${progress}%` : pages ? ` · ${pages} pages` : ""}
              </p>
            </div>
            <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">
              Change
            </button>
          </div>

          {busy && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.max(4, progress)}%` }} />
            </div>
          )}

          {!busy && empty && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-brass/30 bg-brass-soft px-4 py-3 text-sm text-brass">
              No selectable text found — this looks like a scanned PDF (just images). Text extraction needs a text-based PDF.
            </div>
          )}

          {!busy && !empty && (
            <>
              <textarea
                readOnly
                value={text}
                className="mt-4 h-72 w-full resize-y rounded-[var(--radius-md)] border border-mist bg-surface-1 p-4 font-mono text-sm text-ink outline-none focus:border-accent"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={txtUrl ?? undefined}
                  download={downloadName}
                  className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
                >
                  Download .txt
                </a>
                <button
                  onClick={copy}
                  className="rounded-full border border-mist bg-surface-1 px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent"
                >
                  {copied ? "Copied!" : "Copy text"}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
