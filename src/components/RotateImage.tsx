import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  transformImage,
  type CompressFormat,
  type ImageToolResult,
} from "../lib/imageTools";
import Dropdown, { type DropdownOption } from "./Dropdown";

type ItemStatus = "queued" | "working" | "done" | "error";
type Rotate = 0 | 90 | 180 | 270;

interface Item {
  id: string;
  file: File;
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

const MAX_FILES = 30;
const MAX_BYTES = 50 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

let seq = 0;

export default function RotateImage() {
  const [items, setItems] = useState<Item[]>([]);
  const [rotate, setRotate] = useState<Rotate>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [format, setFormat] = useState<CompressFormat>("auto");
  const [dragging, setDragging] = useState(false);
  const [justDropped, setJustDropped] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const runTokenRef = useRef(0);
  itemsRef.current = items;

  const settingsRef = useRef({ rotate, flipH, flipV, format });
  settingsRef.current = { rotate, flipH, flipV, format };

  const patch = useCallback((id: string, p: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const run = useCallback(
    async (queue: Item[]) => {
      const token = ++runTokenRef.current;
      for (const item of queue) {
        if (runTokenRef.current !== token) return;
        patch(item.id, { status: "working", error: "" });
        try {
          const s = settingsRef.current;
          const res: ImageToolResult = await transformImage(item.file, {
            rotate: s.rotate,
            flipH: s.flipH,
            flipV: s.flipV,
            format: s.format,
            quality: 0.92,
          });
          if (runTokenRef.current !== token) return;
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
          const msg = e instanceof Error ? e.message : "Couldn't process that image.";
          patch(item.id, { status: "error", error: msg });
        }
      }
    },
    [patch],
  );

  const reapply = useCallback(() => {
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
        setError(`"${tooBig.name}" is ${prettyBytes(tooBig.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`);
        return;
      }
      setError("");
      setJustDropped(true);
      window.setTimeout(() => setJustDropped(false), 360);
      const newItems: Item[] = incoming.map((file) => ({
        id: `t${++seq}`,
        file,
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

  const removeItem = useCallback((id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it?.outUrl) URL.revokeObjectURL(it.outUrl);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const reset = useCallback(() => {
    runTokenRef.current++;
    itemsRef.current.forEach((it) => {
      if (it.outUrl) URL.revokeObjectURL(it.outUrl);
    });
    setItems([]);
    setError("");
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  useEffect(() => {
    return () => {
      runTokenRef.current++;
      itemsRef.current.forEach((it) => {
        if (it.outUrl) URL.revokeObjectURL(it.outUrl);
      });
    };
  }, []);

  const turn = (dir: -1 | 1) => {
    setRotate((r) => (((r + dir * 90) % 360) + 360) % 360 as Rotate);
    window.setTimeout(reapply, 0);
  };
  const toggleFlipH = () => {
    setFlipH((v) => !v);
    window.setTimeout(reapply, 0);
  };
  const toggleFlipV = () => {
    setFlipV((v) => !v);
    window.setTimeout(reapply, 0);
  };

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

  const btn = (active: boolean) =>
    [
      "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors",
      active
        ? "border-accent bg-accent-soft text-accent"
        : "border-mist bg-surface-1 text-stone hover:text-ink hover:border-accent/60",
    ].join(" ");

  return (
    <div className="w-full">
      {/* controls */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => turn(-1)} className={btn(false)} aria-label="Rotate left">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a4 4 0 0 1 4 4v3" /></svg>
            Rotate left
          </button>
          <button onClick={() => turn(1)} className={btn(false)} aria-label="Rotate right">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a4 4 0 0 0-4 4v3" /></svg>
            Rotate right
          </button>
          <button onClick={toggleFlipH} className={btn(flipH)} aria-pressed={flipH}>
            Flip H
          </button>
          <button onClick={toggleFlipV} className={btn(flipV)} aria-pressed={flipV}>
            Flip V
          </button>
        </div>
        <div className="ml-auto">
          <Dropdown
            label="Format"
            ariaLabel="Output format"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={(v) => {
              setFormat(v as CompressFormat);
              window.setTimeout(reapply, 0);
            }}
            withGlyph={false}
            className="w-36"
          />
        </div>
      </div>

      {/* drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Add images to rotate or flip"
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
          <svg width={hasItems ? 18 : 22} height={hasItems ? 18 : 22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
        </div>
        <p className={["font-display text-ink", hasItems ? "text-base" : "text-xl"].join(" ")}>
          {hasItems ? "Drop more images" : "Drop your images here"}
        </p>
        {!hasItems && (
          <p className="mt-1 text-sm text-stone">or click to choose — rotated on your device</p>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
        <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
        Nothing is uploaded. Your images never leave this browser.
      </p>

      {error && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {hasItems && (
        <div className="mt-6 space-y-3">
          {items.map((item, idx) => (
            <RotateCard key={item.id} item={item} index={idx} onRemove={() => removeItem(item.id)} prettyBytes={prettyBytes} />
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



function RotateCard({
  item,
  index,
  onRemove,
  prettyBytes,
}: {
  item: Item;
  index: number;
  onRemove: () => void;
  prettyBytes: (n: number) => string;
}) {
  const { file, status } = item;
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [item.outUrl]);
  const showImg = !!item.outUrl && !imgError;

  return (
    <div
      className="animate-card-in flex items-center gap-4 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 shadow-[var(--shadow-1)] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="bg-checker relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-mist">
        {showImg ? (
          <img src={item.outUrl!} alt="" className="h-full w-full object-contain" onError={() => setImgError(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone">IMG</div>
        )}
        {status === "working" && (
          <div className="bg-canvas/60 absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-mist border-t-accent" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{file.name}</p>
        {status === "queued" && <p className="mt-1 text-xs text-stone">queued</p>}
        {status === "working" && <p className="mt-1 text-xs text-stone">Processing on your device…</p>}
        {status === "error" && <p className="mt-1 text-xs text-danger">{item.error}</p>}
        {status === "done" && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-xs text-stone">
              {item.outW}×{item.outH}
            </span>
            <span className="animate-settle rounded-full bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent">
              {prettyBytes(item.outBytes)}
            </span>
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
