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

type Status = "idle" | "working" | "done" | "error";

interface DoneItem {
  result: ConvertResult;
  url: string;
}

/* ---------------- Anti-fragile memory management ----------------
   Detect device class, cap batch size/bytes, process strictly sequentially
   with GC breathing room, and tell the user what's happening. Heavy engines
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

/** Check if user prefers reduced motion */
function getReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Converter({ engine, to, fromName, toName, accept }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<DoneItem[]>([]);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [statusLabel, setStatusLabel] = useState("Converting on your device…");
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const [showShimmer, setShowShimmer] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const prefersReducedMotion = getReducedMotion();

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

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const d = device ?? detectDevice(engine);
      const files = Array.from(fileList);

      const validationError = validateBatch(files, d);
      if (validationError) {
        setError(validationError);
        setStatus("error");
        return;
      }

      setStatus("working");
      setError("");
      setInfo("");
      setProgress({ done: 0, total: files.length });
      setStatusLabel(
        engineIsHeavy(engine)
          ? "Loading audio engine (first use only)…"
          : "Converting on your device…",
      );
      const done: DoneItem[] = [];

      try {
        // PDF mobile guard: cap pages rendered and lower render scale.
        const opts = {
          maxPages: d.lowMemory && engine === "pdf2img" ? 30 : undefined,
          scale: d.lowMemory && engine === "pdf2img" ? 1.5 : undefined,
          onProgress: (_r: number, label: string) => setStatusLabel(label),
          onInfo: (message: string) => setInfo(message),
        };

        for (let i = 0; i < files.length; i++) {
          const outputs = await convertFile(files[i], engine, to, opts);
          for (const result of outputs) {
            done.push({ result, url: URL.createObjectURL(result.blob) });
          }
          setProgress({ done: i + 1, total: files.length });

          if (d.lowMemory && i < files.length - 1) {
            setStatusLabel("Optimizing memory…");
            await breathe(150);
            setStatusLabel("Converting on your device…");
          }
        }
        setItems((prev) => [...done, ...prev]);
        setStatus("done");

        // Trigger shimmer effect on success
        if (!prefersReducedMotion) {
          setShowShimmer(true);
          setTimeout(() => setShowShimmer(false), 600);
        }
      } catch (e) {
        console.error("[ZeroUpload] conversion error:", e);
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === "string"
              ? e
              : "Something went wrong converting that file.";
        setError(msg);
        setStatus("error");
      } finally {
        setProgress(null);
      }
    },
    [engine, to, device, validateBatch, prefersReducedMotion],
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
      items.forEach((i) => URL.revokeObjectURL(i.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setStatus("idle");
    setError("");
    setInfo("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const working = status === "working";

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={working}
        onClick={() => !working && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!working && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!working) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={[
          "group relative flex w-full cursor-pointer flex-col items-center justify-center",
          "rounded-[var(--radius-xl)] border-2 border-dashed px-8 py-16 text-center transition-all duration-200",
          dragging ? "border-accent bg-accent-soft" : "border-mist bg-paper hover:border-accent/60",
          working ? "cursor-progress" : "",
        ].join(" ")}
      >
        {/* Dropzone glow - subtle radial gradient pulse in idle state */}
        {!working && !prefersReducedMotion && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[var(--radius-xl)]"
            style={{
              background: "radial-gradient(ellipse at center, oklch(37% 0.08 165 / 0.06) 0%, transparent 70%)",
              animation: "dropzone-glow 3s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
        )}

        {/* Shimmer overlay on success */}
        {showShimmer && (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--radius-xl)]"
            aria-hidden="true"
          >
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent 0%, oklch(66% 0.12 70 / 0.12) 50%, transparent 100%)",
                animation: "shimmer 0.6s ease-out forwards",
              }}
            />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {working ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-mist border-t-accent" />
            <p className="text-sm font-medium text-ink">{statusLabel}</p>
            {progress && progress.total > 1 && (
              <p className="text-xs text-stone">{progress.done} of {progress.total} done</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 16V4" />
                <path d="m6 10 6-6 6 6" />
                <path d="M4 20h16" />
              </svg>
            </div>
            <p className="font-display text-xl text-ink">
              Drop your {fromName} {items.length ? "files" : "file"} here
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
          </>
        )}
      </div>

      {/* Privacy text with offline-proof pill */}
      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-stone">
        <span className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          </svg>
          Nothing is uploaded. Your files never leave this browser.
        </span>

        {/* Offline-proof pill */}
        <span className="inline-flex items-center gap-1 rounded-full border border-mist bg-paper px-2 py-0.5 text-[10px] font-mono text-stone">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={prefersReducedMotion ? "" : "animate-wifi-pulse"}
            style={prefersReducedMotion ? {} : { animation: "wifi-pulse 4s ease-in-out infinite" }}
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" />
          </svg>
          offline-proof
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {info && (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          {info}
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-6 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 rounded-xl border border-mist bg-paper px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{item.result.filename}</p>
                <p className="text-xs text-stone">
                  {prettyBytes(item.result.blob.size)} · done in <span className="font-mono">{item.result.ms}ms</span>
                </p>
              </div>
              <a
                href={item.url}
                download={item.result.filename}
                className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
              >
                Download
              </a>
            </div>
          ))}
          <button onClick={reset} className="text-sm text-stone underline-offset-4 hover:underline">
            Convert more files
          </button>
        </div>
      )}
    </div>
  );
}
