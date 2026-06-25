import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { mergePdfs, getPdfPageCount } from "../lib/pdfTools";

interface Item {
  id: string;
  file: File;
  pages: number | null;
}

const MAX_FILES = 30;
const MAX_BYTES = 100 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;

export default function PdfMerge() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [justDropped, setJustDropped] = useState(false);
  const [error, setError] = useState("");
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState<{ url: string; name: string; bytes: number; pages: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const resultRef = useRef<{ url: string } | null>(null);
  itemsRef.current = items;
  resultRef.current = result;

  const clearResult = useCallback(() => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
    setResult(null);
  }, []);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list).filter(
        (f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf",
      );
      if (incoming.length === 0) {
        setError("Please choose PDF files.");
        return;
      }
      if (incoming.length + itemsRef.current.length > MAX_FILES) {
        setError(`Please keep to ${MAX_FILES} PDFs at a time.`);
        return;
      }
      const tooBig = incoming.find((f) => f.size > MAX_BYTES);
      if (tooBig) {
        setError(`"${tooBig.name}" is ${prettyBytes(tooBig.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`);
        return;
      }
      setError("");
      clearResult();
      setJustDropped(true);
      window.setTimeout(() => setJustDropped(false), 360);

      const newItems: Item[] = incoming.map((file) => ({ id: `m${++seq}`, file, pages: null }));
      setItems((prev) => [...prev, ...newItems]);

      // Resolve page counts in the background.
      newItems.forEach(async (it) => {
        try {
          const pages = await getPdfPageCount(it.file);
          setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, pages } : x)));
        } catch {
          /* leave pages null; merge will validate */
        }
      });
    },
    [clearResult],
  );

  const move = useCallback((id: string, dir: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
    clearResult();
  }, [clearResult]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    clearResult();
  }, [clearResult]);

  const reset = useCallback(() => {
    setItems([]);
    setError("");
    clearResult();
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  const doMerge = useCallback(async () => {
    if (itemsRef.current.length < 2) {
      setError("Add at least two PDFs to merge.");
      return;
    }
    setError("");
    setMerging(true);
    clearResult();
    try {
      const res = await mergePdfs(itemsRef.current.map((it) => it.file));
      setResult({
        url: URL.createObjectURL(res.blob),
        name: res.filename,
        bytes: res.blob.size,
        pages: res.pages ?? 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't merge those PDFs.");
    } finally {
      setMerging(false);
    }
  }, [clearResult]);

  useEffect(() => {
    return () => {
      if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
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

  const hasItems = items.length > 0;

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Add PDFs to merge"
        onClick={() => inputRef.current?.click()}
        onKeyDown={onKey}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "relative flex w-full cursor-pointer flex-col items-center justify-center text-center",
          "rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200",
          hasItems ? "px-6 py-8" : "px-8 py-16",
          justDropped ? "animate-drop-react" : "",
          dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <div
          className={[
            "flex items-center justify-center rounded-full bg-accent-soft text-accent",
            hasItems ? "mb-2 h-9 w-9" : "mb-4 h-12 w-12",
          ].join(" ")}
        >
          <svg width={hasItems ? 18 : 22} height={hasItems ? 18 : 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </div>
        <p className={["font-display text-ink", hasItems ? "text-base" : "text-xl"].join(" ")}>
          {hasItems ? "Add more PDFs" : "Drop your PDFs here"}
        </p>
        {!hasItems && (
          <p className="mt-1 text-sm text-stone">or click to choose — merged on your device</p>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
        <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        Nothing is uploaded. Your PDFs never leave this browser.
      </p>

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {hasItems && (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-stone">Drag-free reorder — they merge top to bottom:</p>
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="animate-card-in flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 shadow-[var(--shadow-1)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
                <p className="text-xs text-stone">
                  {prettyBytes(item.file.size)}
                  {item.pages !== null && ` · ${item.pages} page${item.pages === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => move(item.id, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone transition-colors hover:text-ink disabled:opacity-30"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6" /></svg>
                </button>
                <button
                  onClick={() => move(item.id, 1)}
                  disabled={idx === items.length - 1}
                  aria-label="Move down"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-stone transition-colors hover:text-ink disabled:opacity-30"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.file.name}`}
                  className="hover:bg-canvas flex h-8 w-8 items-center justify-center rounded-full text-stone transition-colors hover:text-ink"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                </button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={reset}
              className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Clear all
            </button>
            {result ? (
              <a
                href={result.url}
                download={result.name}
                className="animate-settle rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90"
              >
                Download merged PDF · {result.pages} pages · {prettyBytes(result.bytes)}
              </a>
            ) : (
              <button
                onClick={doMerge}
                disabled={merging || items.length < 2}
                className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {merging ? "Merging…" : `Merge ${items.length} PDFs`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
