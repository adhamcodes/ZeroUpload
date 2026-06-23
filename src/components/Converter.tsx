import { useCallback, useEffect, useRef, useState } from "react";
import {
  convertFile,
  engineIsHeavy,
  type ConvertResult,
  type EngineId,
} from "../lib/convert";

interface Props {
  /** engine that powers this conversion */
  engine: EngineId;
  /** target format id, e.g. "jpg" */
  to: string;
  /** source format name for copy, e.g. "PNG" */
  fromName: string;
  /** target format name for copy, e.g. "JPG" */
  toName: string;
  /** accept attribute hint */
  accept?: string;
}

type FileStatus = "queued" | "converting" | "done" | "error";

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  previewUrl: string | null;
  pdfCanvas: HTMLCanvasElement | null;
  originalSize: number;
  error?: string;
}

interface DoneItem {
  result: ConvertResult;
  url: string;
  originalSize: number;
  fileId: string;
}

/* ---------------- Anti-fragile memory management ----------------
   Detect device class, cap batch size/bytes, process strictly sequentially
   with GC breathing room, and tell the user what is happening. Heavy engines
   (audio) also get a generous size budget since ffmpeg streams. */

interface DeviceProfile {
  isMobile: boolean;
  lowMemory: boolean;
  maxFiles: number;
  maxFileBytes: number;
  maxBatchBytes: number;
}

function detectDevice(engine: EngineId): DeviceProfile {
  const big = engine === "audio" || engine === "pdf2img";
  if (typeof navigator === "undefined") {
    return {
      isMobile: false, lowMemory: false, maxFiles: 50,
      maxFileBytes: (big ? 300 : 100) * 1024 * 1024,
      maxBatchBytes: 400 * 1024 * 1024,
    };
  }
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const lowMemory = isMobile || (typeof deviceMemory === "number" && deviceMemory <= 4);

  if (lowMemory) {
    return {
      isMobile, lowMemory: true,
      maxFiles: big ? 2 : 5,
      maxFileBytes: (big ? 60 : 25) * 1024 * 1024,
      maxBatchBytes: (big ? 80 : 60) * 1024 * 1024,
    };
  }
  return {
    isMobile, lowMemory: false,
    maxFiles: big ? 10 : 50,
    maxFileBytes: (big ? 500 : 100) * 1024 * 1024,
    maxBatchBytes: 800 * 1024 * 1024,
  };
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function breathe(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/* ------------ PDF Preview Helper ------------ */
async function renderPdfPreview(file: File): Promise<HTMLCanvasElement | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    // Worker URL resolved by Vite as a static asset (same pattern as engines/pdf.ts)
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      const workerUrl = (
        await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
      ).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1 });
    const targetWidth = 128;
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    return canvas;
  } catch {
    return null;
  }
}

/* ------------ Glyph SVG for non-image/PDF ------------ */
function FileGlyph() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-stone"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/* ------------ FileCard Component ------------ */
function FileCard({ entry }: { entry: FileEntry }) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (entry.pdfCanvas && canvasRef.current) {
      canvasRef.current.innerHTML = "";
      canvasRef.current.appendChild(entry.pdfCanvas);
    }
  }, [entry.pdfCanvas]);

  return (
    <div
      className={[
        "relative overflow-hidden animate-slide-up flex items-center gap-4 rounded-[var(--radius-xl)] border border-mist bg-paper p-4",
        entry.status === "converting" ? "ring-2 ring-accent/30" : "",
      ].join(" ")}
    >
      {/* Preview area */}
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-canvas">
        {entry.previewUrl ? (
          <img
            src={entry.previewUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : entry.pdfCanvas ? (
          <div ref={canvasRef} className="flex h-full w-full items-center justify-center [&>canvas]:max-h-full [&>canvas]:max-w-full [&>canvas]:object-contain" />
        ) : (
          <FileGlyph />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{entry.file.name}</p>
        <p className="text-xs text-stone">{prettyBytes(entry.originalSize)}</p>
        {entry.status === "queued" && (
          <span className="text-xs text-stone">Queued</span>
        )}
        {entry.status === "converting" && (
          <span className="text-xs text-accent font-medium">Converting...</span>
        )}
        {entry.status === "error" && (
          <span className="text-xs text-danger">{entry.error || "Failed"}</span>
        )}
      </div>

      {/* Progress bar for converting state */}
      {entry.status === "converting" && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden rounded-b-[var(--radius-xl)]">
          <div className="animate-progress-fill h-full bg-accent" />
        </div>
      )}
    </div>
  );
}

/* ------------ ResultCard Component ------------ */
function ResultCard({ item }: { item: DoneItem }) {
  const savings = item.originalSize > 0
    ? ((item.originalSize - item.result.blob.size) / item.originalSize) * 100
    : 0;
  const isSaving = savings > 0;
  const resultUrl = item.result.blob.type.startsWith("image/")
    ? item.url
    : null;

  return (
    <div className="animate-settle rounded-[var(--radius-xl)] border border-mist bg-paper p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-center gap-4">
        {/* Result thumbnail */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-canvas">
          {resultUrl ? (
            <img
              src={resultUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <FileGlyph />
          )}
        </div>

        {/* Info + size comparison */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{item.result.filename}</p>
          <p className="mt-1 font-mono text-sm">
            <span className="text-stone">{prettyBytes(item.originalSize)}</span>
            <span className="text-stone"> {"->"} </span>
            <span className="text-ink">{prettyBytes(item.result.blob.size)}</span>
            <span className="text-stone"> · </span>
            <span className={isSaving ? "text-success" : "text-stone"}>
              {Math.abs(Math.round(savings))}% {isSaving ? "smaller" : "larger"}
            </span>
          </p>
        </div>

        {/* Download button */}
        <a
          href={item.url}
          download={item.result.filename}
          className="shrink-0 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
        >
          Download
        </a>
      </div>
    </div>
  );
}

/* ------------ Main Converter Component ------------ */
export default function Converter({ engine, to, fromName, toName, accept }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
  const [doneItems, setDoneItems] = useState<DoneItem[]>([]);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const convertingRef = useRef(false);
  const pendingQueueRef = useRef<FileEntry[]>([]);

  useEffect(() => {
    setDevice(detectDevice(engine));
  }, [engine]);

  const validateBatch = useCallback((files: File[], d: DeviceProfile): string | null => {
    if (files.length > d.maxFiles) {
      return `For a smooth experience on this device, please convert up to ${d.maxFiles} file(s) at a time. You selected ${files.length}.`;
    }
    const oversize = files.find((f) => f.size > d.maxFileBytes);
    if (oversize) {
      return `"${oversize.name}" is ${prettyBytes(oversize.size)}. On this device the per-file limit is ${prettyBytes(d.maxFileBytes)} to keep your browser stable.`;
    }
    const total = files.reduce((sum, f) => sum + f.size, 0);
    if (total > d.maxBatchBytes) {
      return `That batch is ${prettyBytes(total)}. Please keep batches under ${prettyBytes(d.maxBatchBytes)} on this device, or convert in smaller groups.`;
    }
    return null;
  }, []);

  /* Generate previews for file entries */
  const createEntries = useCallback(async (files: File[]): Promise<FileEntry[]> => {
    const entries: FileEntry[] = [];
    for (const file of files) {
      const entry: FileEntry = {
        id: generateId(),
        file,
        status: "queued",
        previewUrl: null,
        pdfCanvas: null,
        originalSize: file.size,
      };

      if (isImageFile(file)) {
        entry.previewUrl = URL.createObjectURL(file);
      } else if (isPdfFile(file)) {
        entry.pdfCanvas = await renderPdfPreview(file);
      }

      entries.push(entry);
    }
    return entries;
  }, []);

  /* Batch cascade: convert files sequentially, updating each card */
  const processBatch = useCallback(
    async (entries: FileEntry[], d: DeviceProfile) => {
      for (const entry of entries) {
        // Mark as converting
        setFileEntries((prev) =>
          prev.map((e) => (e.id === entry.id ? { ...e, status: "converting" } : e)),
        );

        try {
          const opts = {
            maxPages: d.lowMemory && engine === "pdf2img" ? 30 : undefined,
            scale: d.lowMemory && engine === "pdf2img" ? 1.5 : undefined,
            onProgress: () => {},
            onInfo: (message: string) => setInfo(message),
          };

          const outputs = await convertFile(entry.file, engine, to, opts);

          const newDoneItems: DoneItem[] = outputs.map((result) => ({
            result,
            url: URL.createObjectURL(result.blob),
            originalSize: entry.originalSize,
            fileId: entry.id,
          }));

          setDoneItems((prev) => [...newDoneItems, ...prev]);

          // Mark as done
          setFileEntries((prev) =>
            prev.map((e) => (e.id === entry.id ? { ...e, status: "done" } : e)),
          );
        } catch (e) {
          console.error("[ZeroUpload] conversion error:", e);
          const msg =
            e instanceof Error
              ? e.message
              : typeof e === "string"
                ? e
                : "Something went wrong converting that file.";

          setFileEntries((prev) =>
            prev.map((fe) =>
              fe.id === entry.id ? { ...fe, status: "error", error: msg } : fe,
            ),
          );
        }

        // Breathing room on low-memory devices
        if (d.lowMemory) {
          await breathe(150);
        }
      }

      convertingRef.current = false;
      setIsConverting(false);

      // Drain pending queue: if more entries arrived during this batch, process them
      if (pendingQueueRef.current.length > 0) {
        const pending = pendingQueueRef.current;
        pendingQueueRef.current = [];
        convertingRef.current = true;
        setIsConverting(true);
        await processBatch(pending, d);
      }
    },
    [engine, to],
  );

  /* File-first flow: show cards immediately, then start conversion */
  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const d = device ?? detectDevice(engine);
      const files = Array.from(fileList);

      const validationError = validateBatch(files, d);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError("");
      setInfo("");

      // Create entries with previews (file-first flow: show immediately)
      const newEntries = await createEntries(files);
      setFileEntries((prev) => [...prev, ...newEntries]);

      // Start batch cascade conversion
      if (!convertingRef.current) {
        convertingRef.current = true;
        setIsConverting(true);
        await processBatch(newEntries, d);
      } else {
        // Batch is already running; queue new entries for processing after current batch
        pendingQueueRef.current = [...pendingQueueRef.current, ...newEntries];
      }
    },
    [engine, to, device, validateBatch, createEntries, processBatch],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  useEffect(() => {
    return () => {
      // Cleanup object URLs
      fileEntries.forEach((e) => {
        if (e.previewUrl) URL.revokeObjectURL(e.previewUrl);
      });
      doneItems.forEach((i) => URL.revokeObjectURL(i.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    fileEntries.forEach((e) => {
      if (e.previewUrl) URL.revokeObjectURL(e.previewUrl);
    });
    doneItems.forEach((i) => URL.revokeObjectURL(i.url));
    setFileEntries([]);
    setDoneItems([]);
    setError("");
    setInfo("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // Filter file entries: show queued and converting cards (not yet done)
  const activeEntries = fileEntries.filter((e) => e.status === "queued" || e.status === "converting" || e.status === "error");

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-disabled={isConverting}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isConverting) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "group relative flex w-full cursor-pointer flex-col items-center justify-center",
          "rounded-[var(--radius-xl)] border-2 border-dashed px-8 py-10 sm:py-16 text-center transition-all duration-200",
          dragging ? "border-accent bg-accent-soft" : "border-mist bg-paper hover:border-accent/60",
          isConverting ? "cursor-progress" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {isConverting ? (
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-mist border-t-accent" />
            <p className="text-sm font-medium text-ink">
              {engineIsHeavy(engine)
                ? "Loading audio engine (first use only)..."
                : "Converting on your device..."}
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V4" />
                <path d="m6 10 6-6 6 6" />
                <path d="M4 20h16" />
              </svg>
            </div>
            <p className="font-display text-xl text-ink">
              Drop your {fromName} {doneItems.length > 0 ? "files" : "file"} here
            </p>
            <p className="mt-1 text-sm text-stone">
              or click to choose — converted to {toName} instantly, on your device
            </p>
            {device?.lowMemory && (
              <p className="mt-3 text-xs text-stone/80">
                Optimised for this device: up to {device.maxFiles} file(s),{" "}
                {prettyBytes(device.maxFileBytes)} each.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Privacy proof line - always visible */}
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        Nothing is uploaded. Your files never leave this browser.
      </p>

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Info display */}
      {info && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          {info}
        </div>
      )}

      {/* Active file cards (queued/converting/error) */}
      {activeEntries.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {activeEntries.map((entry) => (
            <div key={entry.id} className="relative">
              <FileCard entry={entry} />
            </div>
          ))}
        </div>
      )}

      {/* Result cards (completed conversions) */}
      {doneItems.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {doneItems.map((item, idx) => (
            <ResultCard key={`${item.fileId}-${idx}`} item={item} />
          ))}
        </div>
      )}

      {/* Reset button */}
      {(doneItems.length > 0 || fileEntries.some((e) => e.status === "error")) && !isConverting && (
        <div className="mt-4 text-center">
          <button onClick={reset} className="text-sm text-stone underline-offset-4 hover:underline">
            Convert more files
          </button>
        </div>
      )}
    </div>
  );
}
