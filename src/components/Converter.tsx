import { useCallback, useEffect, useRef, useState } from "react";
import { convertImage, type ConvertResult } from "../lib/convertImage";

interface Props {
  /** target format id, e.g. "jpg" */
  to: string;
  /** source format name for copy, e.g. "PNG" */
  fromName: string;
  /** target format name for copy, e.g. "JPG" */
  toName: string;
  /** accept attribute hint, e.g. ".png,image/png" */
  accept?: string;
}

type Status = "idle" | "working" | "done" | "error";

interface DoneItem {
  result: ConvertResult;
  url: string;
  sourceName: string;
}

/* ---------------- Anti-fragile memory management ----------------
   Worst case we are preventing: a mid-range phone converting several
   heavy images at once, blowing the tab's RAM budget and crashing.
   Strategy: detect device class, cap batch size/bytes, process strictly
   sequentially with GC breathing room, and tell the user what's happening. */

interface DeviceProfile {
  isMobile: boolean;
  lowMemory: boolean;
  maxFiles: number;
  maxFileBytes: number;
  maxBatchBytes: number;
}

function detectDevice(): DeviceProfile {
  if (typeof navigator === "undefined") {
    return {
      isMobile: false,
      lowMemory: false,
      maxFiles: 50,
      maxFileBytes: 100 * 1024 * 1024,
      maxBatchBytes: 400 * 1024 * 1024,
    };
  }
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  // navigator.deviceMemory is in GB (Chrome/Android). Treat <=4GB as low.
  const deviceMemory = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  const lowMemory = isMobile || (typeof deviceMemory === "number" && deviceMemory <= 4);

  if (lowMemory) {
    return {
      isMobile,
      lowMemory: true,
      maxFiles: 5,
      maxFileBytes: 25 * 1024 * 1024, // 25 MB per file on phones
      maxBatchBytes: 60 * 1024 * 1024, // 60 MB total per batch
    };
  }
  return {
    isMobile,
    lowMemory: false,
    maxFiles: 50,
    maxFileBytes: 100 * 1024 * 1024,
    maxBatchBytes: 400 * 1024 * 1024,
  };
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Yield to the event loop so the browser can paint and reclaim memory
 *  between heavy conversions — this is what prevents the RAM spike. */
function breathe(ms = 60): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Converter({ to, fromName, toName, accept }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<DoneItem[]>([]);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [optimizing, setOptimizing] = useState(false);
  const [device, setDevice] = useState<DeviceProfile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Detect device on the client only (avoids SSR mismatch).
  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  const validateBatch = useCallback(
    (files: File[], d: DeviceProfile): string | null => {
      if (files.length > d.maxFiles) {
        return `For a smooth experience on this device, please convert up to ${d.maxFiles} files at a time. You selected ${files.length}.`;
      }
      const oversize = files.find((f) => f.size > d.maxFileBytes);
      if (oversize) {
        return `"${oversize.name}" is ${prettyBytes(oversize.size)}. On this device the per-file limit is ${prettyBytes(
          d.maxFileBytes,
        )} to keep your browser stable.`;
      }
      const total = files.reduce((sum, f) => sum + f.size, 0);
      if (total > d.maxBatchBytes) {
        return `That batch is ${prettyBytes(total)}. Please keep batches under ${prettyBytes(
          d.maxBatchBytes,
        )} on this device, or convert them in smaller groups.`;
      }
      return null;
    },
    [],
  );

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const d = device ?? detectDevice();
      const files = Array.from(fileList);

      const validationError = validateBatch(files, d);
      if (validationError) {
        setError(validationError);
        setStatus("error");
        return;
      }

      setStatus("working");
      setError("");
      setProgress({ done: 0, total: files.length });
      const done: DoneItem[] = [];

      try {
        // STRICTLY SEQUENTIAL — never hold two decoded bitmaps at once.
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const result = await convertImage(file, to);
          done.push({
            result,
            url: URL.createObjectURL(result.blob),
            sourceName: file.name,
          });
          setProgress({ done: i + 1, total: files.length });

          // On low-memory devices, pause between files so the browser can
          // garbage-collect the previous canvas/bitmap before the next one.
          if (d.lowMemory && i < files.length - 1) {
            setOptimizing(true);
            await breathe(120);
            setOptimizing(false);
          }
        }
        setItems((prev) => [...done, ...prev]);
        setStatus("done");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Something went wrong converting that file.",
        );
        setStatus("error");
      } finally {
        setProgress(null);
        setOptimizing(false);
      }
    },
    [to, device, validateBatch],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  // Clean up object URLs when unmounting.
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
    if (inputRef.current) inputRef.current.value = "";
  };

  const working = status === "working";

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-disabled={working}
        onClick={() => !working && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!working && (e.key === "Enter" || e.key === " ")) {
            inputRef.current?.click();
          }
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
          dragging
            ? "border-accent bg-accent-soft"
            : "border-mist bg-paper hover:border-accent/60",
          working ? "cursor-progress" : "",
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

        {working ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-mist border-t-accent" />
            <p className="text-sm font-medium text-ink">
              {optimizing ? "Optimizing memory…" : "Converting on your device…"}
            </p>
            {progress && (
              <p className="text-xs text-stone">
                {progress.done} of {progress.total} done
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
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
                Optimised for this device: up to {device.maxFiles} files,{" "}
                {prettyBytes(device.maxFileBytes)} each.
              </p>
            )}
          </>
        )}
      </div>

      {/* Privacy reassurance line */}
      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        Nothing is uploaded. Your files never leave this browser.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Results */}
      {items.length > 0 && (
        <div className="mt-6 space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-4 rounded-xl border border-mist bg-paper px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {item.result.filename}
                </p>
                <p className="text-xs text-stone">
                  {prettyBytes(item.result.blob.size)} · done in {item.result.ms}ms
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
          <button
            onClick={reset}
            className="text-sm text-stone underline-offset-4 hover:underline"
          >
            Convert more files
          </button>
        </div>
      )}
    </div>
  );
}
