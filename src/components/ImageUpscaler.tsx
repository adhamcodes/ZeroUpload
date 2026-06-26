import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  upscaleImage,
  upscaleSupported,
  SCALE_FACTOR,
  type UpscaleProgress,
} from "../lib/upscale";
import CompareSlider from "./CompareSlider";

type ItemStatus = "queued" | "working" | "done" | "error";

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  resultUrl: string | null;
  resultName: string;
  resultBytes: number;
  outW: number;
  outH: number;
  inW: number;
  inH: number;
  capped: boolean;
  error: string;
}

const ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;

export default function ImageUpscaler() {
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [justDropped, setJustDropped] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  const [phase, setPhase] = useState<UpscaleProgress | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const processingRef = useRef(false);
  itemsRef.current = items;

  useEffect(() => {
    setSupported(upscaleSupported());
  }, []);

  const patch = useCallback((id: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  // Sequential worker — upscaling is heavy, so we never run two at once.
  const pump = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === "queued");
        if (!next) break;
        patch(next.id, { status: "working" });
        try {
          const res = await upscaleImage(next.file, (p) => {
            if (p.stage === "download" || p.stage === "warm") setPhase(p);
            else setPhase(null);
          });
          setModelReady(true);
          setPhase(null);
          patch(next.id, {
            status: "done",
            resultUrl: URL.createObjectURL(res.blob),
            resultName: res.filename,
            resultBytes: res.blob.size,
            outW: res.width,
            outH: res.height,
            inW: res.inputWidth,
            inH: res.inputHeight,
            capped: res.inputWasCapped,
          });
        } catch (e) {
          setPhase(null);
          const msg =
            e instanceof Error ? e.message : "Something went wrong enhancing this image.";
          patch(next.id, { status: "error", error: msg });
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [patch]);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list).filter(
        (f) => /\.(jpe?g|png|webp)$/i.test(f.name) || /^image\/(jpeg|png|webp)/.test(f.type),
      );
      if (incoming.length === 0) {
        setError("Please choose a JPG, PNG or WEBP image.");
        return;
      }
      setError("");
      setJustDropped(true);
      window.setTimeout(() => setJustDropped(false), 360);

      const newItems: Item[] = incoming.map((file) => ({
        id: `u${++seq}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        resultUrl: null,
        resultName: "",
        resultBytes: 0,
        outW: 0,
        outH: 0,
        inW: 0,
        inH: 0,
        capped: false,
        error: "",
      }));
      setItems((prev) => [...prev, ...newItems]);
      window.setTimeout(() => void pump(), 0);
    },
    [pump],
  );

  const removeItem = useCallback((id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) {
      URL.revokeObjectURL(it.previewUrl);
      if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const reset = useCallback(() => {
    itemsRef.current.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
    });
    setItems([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.previewUrl);
        if (it.resultUrl) URL.revokeObjectURL(it.resultUrl);
      });
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
  const busy = items.some((it) => it.status === "working");

  if (!supported) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-6 text-center text-stone">
        Your browser can't run the on-device AI model. Please try a recent version of
        Chrome, Edge, or Firefox on a desktop for the best results.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Add an image to enhance"
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
          accept={ACCEPT}
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
          <svg
            width={hasItems ? 18 : 22}
            height={hasItems ? 18 : 22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <p className={["font-display text-ink", hasItems ? "text-base" : "text-xl"].join(" ")}>
          {hasItems ? "Drop another image" : "Drop a blurry or low-res image here"}
        </p>
        {!hasItems && (
          <p className="mt-1 text-sm text-stone">
            or click to choose — enhanced {SCALE_FACTOR}× on your device
          </p>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
        <svg
          className="animate-wifi-pulse"
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
        Nothing is uploaded. Your image never leaves this browser.
      </p>

      {!modelReady && (
        <p className="mt-2 text-center text-xs text-faint">
          First use downloads a one-time AI model (~7&nbsp;MB), then it's cached and works
          offline.
        </p>
      )}

      {phase && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          <p>{phase.label}</p>
          {typeof phase.pct === "number" && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.max(2, Math.round(phase.pct))}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {hasItems && (
        <div className="mt-6 space-y-3">
          {items.map((item, idx) => (
            <UpscaleCard
              key={item.id}
              item={item}
              index={idx}
              onRemove={() => removeItem(item.id)}
            />
          ))}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={reset}
              disabled={busy}
              className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-50"
            >
              Clear all
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              Add more images
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  item: Item;
  index: number;
  onRemove: () => void;
}

function UpscaleCard({ item, index, onRemove }: CardProps) {
  const { file, status } = item;

  if (status === "done" && item.resultUrl) {
    return (
      <div
        className="animate-card-in rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 shadow-[var(--shadow-1)] sm:p-4"
        style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
      >
        <CompareSlider before={item.previewUrl} after={item.resultUrl} />
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-xs text-stone">
                {item.inW}×{item.inH}
                <span className="mx-1 text-faint">&rarr;</span>
                {item.outW}×{item.outH} PNG
              </span>
              <span className="animate-settle rounded-full bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                {SCALE_FACTOR}× enhanced
              </span>
            </div>
            {item.capped && (
              <p className="mt-1 text-xs text-faint">
                Your image was large, so it was scaled to fit before enhancing — for speed
                and stability.
              </p>
            )}
          </div>
          <a
            href={item.resultUrl}
            download={item.resultName}
            className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Download PNG
          </a>
          <button
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            className="hover:bg-canvas flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone transition-colors hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-card-in flex items-center gap-4 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 shadow-[var(--shadow-1)] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="bg-canvas relative h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-mist">
        <img src={item.previewUrl} alt="" className="h-full w-full object-contain" />
        {status === "working" && (
          <div className="bg-canvas/60 absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-mist border-t-accent" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{file.name}</p>
        {status === "queued" && (
          <p className="mt-1 text-xs text-stone">{prettyBytes(file.size)} · queued</p>
        )}
        {status === "working" && (
          <div className="mt-1.5">
            <p className="text-xs text-stone">Enhancing on your device — this can take a moment…</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-mist">
              <div className="animate-progress-sweep h-full w-1/3 rounded-full bg-accent" />
            </div>
          </div>
        )}
        {status === "error" && <p className="mt-1 text-xs text-danger">{item.error}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {status !== "working" && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            className="hover:bg-canvas flex h-8 w-8 items-center justify-center rounded-full text-stone transition-colors hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
