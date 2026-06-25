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
  compressImage,
  type CompressFormat,
  type ImageToolResult,
} from "../lib/imageTools";
import Dropdown, { type DropdownOption } from "./Dropdown";

type ItemStatus = "queued" | "working" | "done" | "error";

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  outUrl: string | null;
  outName: string;
  outBytes: number;
  outW: number;
  outH: number;
  error: string;
}

const ACCEPT =
  ".jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp";
const RX = /\.(jpe?g|png|webp|gif|bmp)$/i;

const FORMAT_OPTIONS: DropdownOption[] = [
  { id: "auto", name: "Keep original" },
  { id: "jpg", name: "JPG" },
  { id: "webp", name: "WEBP" },
  { id: "png", name: "PNG" },
];

const SIZE_OPTIONS: DropdownOption[] = [
  { id: "orig", name: "Original size" },
  { id: "2560", name: "Max 2560px" },
  { id: "1920", name: "Max 1920px" },
  { id: "1280", name: "Max 1280px" },
  { id: "800", name: "Max 800px" },
];

const MAX_FILES = 30;
const MAX_BYTES = 50 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;

interface Props {
  /** lock the output format on a per-format SEO page (hides the picker) */
  lockedFormat?: CompressFormat;
  lockedFormatName?: string;
}

export default function ImageCompressor({
  lockedFormat,
  lockedFormatName,
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [quality, setQuality] = useState(80); // percent
  const [format, setFormat] = useState<CompressFormat>(lockedFormat ?? "auto");
  const [size, setSize] = useState("orig");
  const [dragging, setDragging] = useState(false);
  const [justDropped, setJustDropped] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const runTokenRef = useRef(0);
  const debounceRef = useRef<number | null>(null);
  itemsRef.current = items;

  // current settings as a ref so the worker always reads the latest values
  const settingsRef = useRef({ quality, format, size });
  settingsRef.current = { quality, format, size };

  const maxEdgeFor = useCallback((s: string): number | undefined => {
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  }, []);

  const patch = useCallback((id: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  /** Compress (or re-compress) the given items sequentially with current settings. */
  const run = useCallback(
    async (queue: Item[]) => {
      const token = ++runTokenRef.current;
      for (const item of queue) {
        if (runTokenRef.current !== token) return;
        patch(item.id, { status: "working", error: "" });
        try {
          const { quality, format, size } = settingsRef.current;
          const res: ImageToolResult = await compressImage(item.file, {
            format,
            quality: quality / 100,
            maxEdge: maxEdgeFor(size),
          });
          if (runTokenRef.current !== token) return;
          // revoke any previous output url for this item
          const prev = itemsRef.current.find((x) => x.id === item.id);
          if (prev?.outUrl) URL.revokeObjectURL(prev.outUrl);
          patch(item.id, {
            status: "done",
            outUrl: URL.createObjectURL(res.blob),
            outName: res.filename,
            outBytes: res.blob.size,
            outW: res.width,
            outH: res.height,
          });
        } catch (e) {
          if (runTokenRef.current !== token) return;
          const msg =
            e instanceof Error ? e.message : "Couldn't compress that image.";
          patch(item.id, { status: "error", error: msg });
        }
      }
    },
    [patch, maxEdgeFor],
  );

  const recompressAll = useCallback(() => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    setItems((prev) => prev.map((it) => ({ ...it, status: "working" as ItemStatus })));
    void run(current);
  }, [run]);

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list || list.length === 0) return;
      const incoming = Array.from(list).filter(
        (f) => RX.test(f.name) || /^image\//.test(f.type),
      );
      if (incoming.length === 0) {
        setError("Please choose JPG, PNG, WEBP, GIF or BMP images.");
        return;
      }
      if (incoming.length + itemsRef.current.length > MAX_FILES) {
        setError(`Please keep to ${MAX_FILES} images at a time.`);
        return;
      }
      const tooBig = incoming.find((f) => f.size > MAX_BYTES);
      if (tooBig) {
        setError(
          `"${tooBig.name}" is ${prettyBytes(tooBig.size)} — the per-image limit is ${prettyBytes(MAX_BYTES)}.`,
        );
        return;
      }
      setError("");
      setJustDropped(true);
      window.setTimeout(() => setJustDropped(false), 360);

      const newItems: Item[] = incoming.map((file) => ({
        id: `c${++seq}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: "queued",
        outUrl: null,
        outName: "",
        outBytes: 0,
        outW: 0,
        outH: 0,
        error: "",
      }));
      setItems((prev) => [...prev, ...newItems]);
      window.setTimeout(() => void run(newItems), 0);
    },
    [run],
  );

  // Re-compress when the format or size changes (immediate).
  const onFormat = useCallback(
    (id: string) => {
      setFormat(id as CompressFormat);
      window.setTimeout(recompressAll, 0);
    },
    [recompressAll],
  );
  const onSize = useCallback(
    (id: string) => {
      setSize(id);
      window.setTimeout(recompressAll, 0);
    },
    [recompressAll],
  );

  // Quality slider — debounce so dragging doesn't spam the encoder.
  const onQuality = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setQuality(Number(e.target.value));
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => recompressAll(), 250);
    },
    [recompressAll],
  );

  const removeItem = useCallback((id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) {
      URL.revokeObjectURL(it.previewUrl);
      if (it.outUrl) URL.revokeObjectURL(it.outUrl);
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const reset = useCallback(() => {
    runTokenRef.current++;
    itemsRef.current.forEach((it) => {
      URL.revokeObjectURL(it.previewUrl);
      if (it.outUrl) URL.revokeObjectURL(it.outUrl);
    });
    setItems([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    return () => {
      runTokenRef.current++;
      itemsRef.current.forEach((it) => {
        URL.revokeObjectURL(it.previewUrl);
        if (it.outUrl) URL.revokeObjectURL(it.outUrl);
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
  const totalIn = items.reduce((s, it) => s + it.file.size, 0);
  const totalOut = items.reduce(
    (s, it) => s + (it.status === "done" ? it.outBytes : 0),
    0,
  );
  const doneCount = items.filter((it) => it.status === "done").length;
  const totalPct =
    doneCount > 0 && totalIn > 0
      ? Math.round((1 - totalOut / totalIn) * 100)
      : null;

  return (
    <div className="w-full">
      {/* controls */}
      <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <label
            htmlFor="quality"
            className="mb-1.5 flex items-center justify-between font-display text-sm font-medium text-ink"
          >
            <span>Quality</span>
            <span className="font-mono text-accent">{quality}%</span>
          </label>
          <input
            id="quality"
            type="range"
            min={20}
            max={100}
            step={1}
            value={quality}
            onChange={onQuality}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-mist accent-[var(--color-accent)]"
          />
        </div>

        {!lockedFormat && (
          <Dropdown
            label="Format"
            ariaLabel="Output format"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={onFormat}
            withGlyph={false}
            className="w-40"
          />
        )}

        <Dropdown
          label="Resize"
          ariaLabel="Maximum dimension"
          options={SIZE_OPTIONS}
          value={size}
          onChange={onSize}
          withGlyph={false}
          className="w-40"
        />
      </div>

      {/* drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Add images to compress"
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
          dragging
            ? "border-accent bg-accent-soft"
            : "border-mist bg-surface-1 hover:border-accent",
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
            <path d="M8 4v4H4" />
            <path d="M16 4v4h4" />
            <path d="M8 20v-4H4" />
            <path d="M16 20v-4h4" />
          </svg>
        </div>
        <p
          className={["font-display text-ink", hasItems ? "text-base" : "text-xl"].join(" ")}
        >
          {hasItems
            ? "Drop more images"
            : `Drop your ${lockedFormatName ?? "image"}s here`}
        </p>
        {!hasItems && (
          <p className="mt-1 text-sm text-stone">
            or click to choose — compressed on your device
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
        Nothing is uploaded. Your images never leave this browser.
      </p>

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* summary */}
      {totalPct !== null && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-[var(--radius-md)] border border-accent/30 bg-accent-soft px-4 py-3 text-center text-sm text-accent">
          <span className="font-medium">Saved {totalPct}% overall</span>
          <span className="font-mono text-xs opacity-80">
            {prettyBytes(totalIn)} → {prettyBytes(totalOut)}
          </span>
        </div>
      )}

      {/* cards */}
      {hasItems && (
        <div className="mt-6 space-y-3">
          {items.map((item, idx) => (
            <CompressCard
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
            {doneCount > 1 && (
              <span className="text-sm text-stone">
                {doneCount} images compressed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function pct(orig: number, out: number): number | null {
  if (!orig || !out) return null;
  return Math.round((1 - out / orig) * 100);
}

function CompressCard({
  item,
  index,
  onRemove,
}: {
  item: Item;
  index: number;
  onRemove: () => void;
}) {
  const { file, status } = item;
  const saved = status === "done" ? pct(file.size, item.outBytes) : null;
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="animate-card-in flex items-center gap-4 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 shadow-[var(--shadow-1)] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-mist bg-canvas">
        {!imgError ? (
          <img
            src={item.previewUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone">
            IMG
          </div>
        )}
        {status === "working" && (
          <div className="bg-canvas/60 absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-mist border-t-accent" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{file.name}</p>

        {status === "queued" && (
          <p className="mt-1 text-xs text-stone">
            {prettyBytes(file.size)} · queued
          </p>
        )}
        {status === "working" && (
          <p className="mt-1 text-xs text-stone">Compressing on your device…</p>
        )}
        {status === "error" && (
          <p className="mt-1 text-xs text-danger">{item.error}</p>
        )}
        {status === "done" && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-stone">
              {prettyBytes(file.size)}
              <span className="mx-1 text-faint">→</span>
              {prettyBytes(item.outBytes)}
              <span className="ml-1 text-faint">
                · {item.outW}×{item.outH}
              </span>
            </span>
            {saved !== null && saved > 0 && (
              <span className="animate-settle rounded-full bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                {saved}% smaller
              </span>
            )}
            {saved !== null && saved <= 0 && (
              <span className="rounded-full bg-brass-soft px-2 py-0.5 font-mono text-xs font-semibold text-brass">
                already optimal
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {status === "done" && item.outUrl && (
          <a
            href={item.outUrl}
            download={item.outName}
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Download
          </a>
        )}
        {status !== "working" && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${file.name}`}
            className="hover:bg-canvas flex h-8 w-8 items-center justify-center rounded-full text-stone transition-colors hover:text-ink"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
