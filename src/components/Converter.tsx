import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import {
  convertFile,
  engineIsHeavy,
  type ConvertResult,
  type EngineId,
} from "../lib/convert";
import { makePreviewUrl, isRasterFormat } from "../lib/preview";
import Dropdown, { type DropdownOption } from "./Dropdown";
import FormatGlyph from "./FormatGlyph";

export interface ConverterSource {
  id: string;
  name: string;
  /** accept hint contributed to the file input */
  accept?: string;
}

export interface ConverterTarget {
  id: string;
  name: string;
}

interface Props {
  /** formats the user may drop (used for the input accept + detection) */
  sources: ConverterSource[];
  /** formats the user may convert to */
  targets: ConverterTarget[];
  /** engine for a given pair, keyed "from-to" */
  engineMap: Record<string, EngineId>;
  /** initially-selected target id */
  defaultTo: string;
  /**
   * When set (SEO pages), every dropped file is treated as this source format
   * and the source is shown as a fixed chip instead of being auto-detected.
   */
  lockedFrom?: string;
  /** label for the locked source chip, e.g. "PNG" */
  lockedFromName?: string;
  /**
   * Homepage console: start collapsed and "jump open" to reveal the controls
   * on first click / drag / paste. Tool pages leave this off (always open).
   */
  collapsible?: boolean;
}

type ItemStatus = "preview" | "converting" | "done" | "error";

interface OutputFile {
  result: ConvertResult;
  url: string;
}

interface FileItem {
  id: string;
  file: File;
  fromId: string;
  status: ItemStatus;
  previewUrl: string | null;
  progressLabel: string;
  outputs: OutputFile[];
  outBytes: number;
  /** result thumbnail (raster targets only); aliases an output url */
  resultThumbUrl: string | null;
  error: string;
}

/* ---------------- device / memory guards (preserved) ---------------- */

interface DeviceProfile {
  isMobile: boolean;
  lowMemory: boolean;
  maxFiles: number;
  maxFileBytes: number;
  maxBatchBytes: number;
}

function detectDevice(big: boolean): DeviceProfile {
  if (typeof navigator === "undefined") {
    return {
      isMobile: false,
      lowMemory: false,
      maxFiles: 50,
      maxFileBytes: (big ? 300 : 100) * 1024 * 1024,
      maxBatchBytes: 400 * 1024 * 1024,
    };
  }
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  const deviceMemory = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  const lowMemory =
    isMobile || (typeof deviceMemory === "number" && deviceMemory <= 4);

  if (lowMemory) {
    return {
      isMobile,
      lowMemory: true,
      maxFiles: big ? 2 : 5,
      maxFileBytes: (big ? 60 : 25) * 1024 * 1024,
      maxBatchBytes: (big ? 80 : 60) * 1024 * 1024,
    };
  }
  return {
    isMobile,
    lowMemory: false,
    maxFiles: big ? 10 : 50,
    maxFileBytes: (big ? 300 : 100) * 1024 * 1024,
    maxBatchBytes: 800 * 1024 * 1024,
  };
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function breathe(ms = 120): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const EXT_ALIASES: Record<string, string> = {
  jpeg: "jpg",
  jpg: "jpg",
  heif: "heic",
  tif: "tiff",
};

const AUTO = "auto";

let itemSeq = 0;

export default function Converter({
  sources,
  targets,
  engineMap,
  defaultTo,
  lockedFrom,
  lockedFromName,
  collapsible = false,
}: Props) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [selectedTo, setSelectedTo] = useState(
    targets.some((t) => t.id === defaultTo) ? defaultTo : targets[0]?.id ?? "",
  );
  const [selectedFrom, setSelectedFrom] = useState<string>(AUTO);
  const [dragging, setDragging] = useState(false);
  const [justDropped, setJustDropped] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Collapsible (homepage) reveal state.
  const [revealed, setRevealed] = useState(!collapsible);
  const [justRevealed, setJustRevealed] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef<FileItem[]>([]);
  const runTokenRef = useRef(0);
  // true only when the user *manually* picked a source format (overrides auto).
  const manualFromRef = useRef(false);
  itemsRef.current = items;

  /* whether the current target involves a "big" engine across any source */
  const targetIsBig = useCallback(
    (toId: string) =>
      sources.some((s) => {
        const e = engineMap[`${s.id}-${toId}`];
        return e === "audio" || e === "pdf2img";
      }),
    [sources, engineMap],
  );

  const accept = useMemo(() => {
    const parts = sources.map((s) => s.accept ?? `.${s.id}`);
    return Array.from(new Set(parts.join(",").split(","))).join(",");
  }, [sources]);

  const targetName =
    targets.find((t) => t.id === selectedTo)?.name ?? selectedTo.toUpperCase();

  const targetOptions: DropdownOption[] = targets.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const fromOptions: DropdownOption[] = useMemo(
    () => [
      { id: AUTO, name: "Auto-detect" },
      ...sources.map((s) => ({ id: s.id, name: s.name })),
    ],
    [sources],
  );

  /* ---- source detection ---- */
  const detectAuto = useCallback(
    (file: File): string => {
      const name = file.name.toLowerCase();
      const rawExt = name.includes(".") ? name.split(".").pop()! : "";
      const ext = EXT_ALIASES[rawExt] ?? rawExt;
      if (sources.some((s) => s.id === ext)) return ext;
      const mime = file.type;
      const byMime = sources.find((s) => mime && mime.includes(s.id));
      if (byMime) return byMime.id;
      return rawExt || (sources[0]?.id ?? "");
    },
    [sources],
  );

  const detectFrom = useCallback(
    (file: File): string => {
      if (lockedFrom) return lockedFrom;
      // Only override auto-detection when the user explicitly chose a format.
      if (manualFromRef.current && selectedFrom !== AUTO) return selectedFrom;
      return detectAuto(file);
    },
    [lockedFrom, selectedFrom, detectAuto],
  );

  /* ---- validation (preserved) ---- */
  const validateBatch = useCallback(
    (files: File[], d: DeviceProfile): string | null => {
      const existing = itemsRef.current.length;
      if (files.length + existing > d.maxFiles) {
        return `For a smooth experience on this device, please keep to ${d.maxFiles} file(s) at a time.`;
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
    },
    [],
  );

  const patchItem = useCallback((id: string, patch: Partial<FileItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  }, []);

  /* ---- the conversion run (sequential cascade + abort token) ---- */
  const runConversion = useCallback(
    async (toId: string, queue: FileItem[]) => {
      const token = ++runTokenRef.current;
      const d = detectDevice(targetIsBig(toId));
      setInfo("");

      for (const item of queue) {
        if (runTokenRef.current !== token) return; // superseded

        const engine = engineMap[`${item.fromId}-${toId}`];
        if (!engine) {
          patchItem(item.id, {
            status: "error",
            error:
              item.fromId === toId
                ? `Already a ${toId.toUpperCase()} file — nothing to convert.`
                : `Can't convert ${item.fromId.toUpperCase()} to ${toId.toUpperCase()}.`,
          });
          continue;
        }

        patchItem(item.id, {
          status: "converting",
          progressLabel: engineIsHeavy(engine)
            ? "Loading engine (first use only)…"
            : "Converting on your device…",
          error: "",
        });

        try {
          const opts = {
            maxPages: d.lowMemory && engine === "pdf2img" ? 30 : undefined,
            scale: d.lowMemory && engine === "pdf2img" ? 1.5 : undefined,
            onProgress: (_r: number, label: string) =>
              patchItem(item.id, { progressLabel: label }),
            onInfo: (message: string) => setInfo(message),
          };

          const outputs = await convertFile(item.file, engine, toId, opts);
          if (runTokenRef.current !== token) return; // superseded mid-flight

          const urls: OutputFile[] = outputs.map((result) => ({
            result,
            url: URL.createObjectURL(result.blob),
          }));
          const outBytes = outputs.reduce((s, o) => s + o.blob.size, 0);
          const resultThumbUrl =
            isRasterFormat(toId) && urls.length > 0 ? urls[0].url : null;

          patchItem(item.id, {
            status: "done",
            outputs: urls,
            outBytes,
            resultThumbUrl,
            progressLabel: "",
          });
        } catch (e) {
          if (runTokenRef.current !== token) return;
          console.error("[ZeroUpload] conversion error:", e);
          const msg =
            e instanceof Error
              ? e.message
              : typeof e === "string"
                ? e
                : "Something went wrong converting that file.";
          patchItem(item.id, { status: "error", error: msg, progressLabel: "" });
        }

        if (d.lowMemory) await breathe(150);
      }
    },
    [engineMap, targetIsBig, patchItem],
  );

  /* ---- add files ---- */
  const addFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const d = detectDevice(targetIsBig(selectedTo));

      const validationError = validateBatch(files, d);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError("");

      // drop reaction (functional, one-shot)
      setJustDropped(true);
      window.setTimeout(() => setJustDropped(false), 360);

      const newItems: FileItem[] = files.map((file) => ({
        id: `f${++itemSeq}`,
        file,
        fromId: detectFrom(file),
        status: "preview",
        previewUrl: null,
        progressLabel: "",
        outputs: [],
        outBytes: 0,
        resultThumbUrl: null,
        error: "",
      }));

      // Reflect the detected source in the "From" dropdown (display only, unless
      // the user has manually overridden it). Keeps per-file detection intact.
      if (!lockedFrom && !manualFromRef.current && newItems[0]) {
        setSelectedFrom(newItems[0].fromId);
      }

      setItems((prev) => [...prev, ...newItems]);

      // Kick off conversion immediately (cascade); previews resolve in parallel.
      void runConversion(selectedTo, newItems);

      newItems.forEach(async (it) => {
        const url = await makePreviewUrl(it.file, it.fromId);
        if (url) patchItem(it.id, { previewUrl: url });
      });
    },
    [
      selectedTo,
      targetIsBig,
      validateBatch,
      detectFrom,
      runConversion,
      patchItem,
      lockedFrom,
    ],
  );

  /* ---- target change -> re-convert everything ---- */
  const changeTarget = useCallback(
    (toId: string) => {
      setSelectedTo(toId);
      const current = itemsRef.current;
      if (current.length === 0) return;
      current.forEach((it) => {
        it.outputs.forEach((o) => URL.revokeObjectURL(o.url));
      });
      setItems((prev) =>
        prev.map((it) => ({
          ...it,
          status: "converting",
          outputs: [],
          outBytes: 0,
          resultThumbUrl: null,
          error: "",
        })),
      );
      void runConversion(toId, current);
    },
    [runConversion],
  );

  /* ---- source change -> re-detect + re-convert everything ---- */
  const changeFrom = useCallback(
    (fromId: string) => {
      manualFromRef.current = fromId !== AUTO;
      setSelectedFrom(fromId);
      const current = itemsRef.current;
      if (current.length === 0) return;
      current.forEach((it) => {
        it.outputs.forEach((o) => URL.revokeObjectURL(o.url));
      });
      const updated = current.map((it) => ({
        ...it,
        fromId: fromId === AUTO ? detectAuto(it.file) : fromId,
        status: "converting" as ItemStatus,
        outputs: [],
        outBytes: 0,
        resultThumbUrl: null,
        error: "",
      }));
      setItems(updated);
      void runConversion(selectedTo, updated);
    },
    [detectAuto, runConversion, selectedTo],
  );

  const removeItem = useCallback((id: string) => {
    const it = itemsRef.current.find((x) => x.id === id);
    if (it) {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      it.outputs.forEach((o) => URL.revokeObjectURL(o.url));
    }
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const reset = useCallback(() => {
    runTokenRef.current++;
    itemsRef.current.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      it.outputs.forEach((o) => URL.revokeObjectURL(o.url));
    });
    setItems([]);
    setError("");
    setInfo("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  /* ---- collapsible reveal (homepage) ---- */
  const reveal = useCallback(() => {
    setRevealed(true);
    setJustRevealed(true);
    window.setTimeout(() => setJustRevealed(false), 440);
  }, []);

  // Revoke every object URL on unmount.
  useEffect(() => {
    return () => {
      runTokenRef.current++;
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
        it.outputs.forEach((o) => URL.revokeObjectURL(o.url));
      });
    };
  }, []);

  // SURPRISE: paste an image/file straight from the clipboard (Ctrl/Cmd+V).
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        e.preventDefault();
        if (collapsible) reveal();
        void addFiles(files);
      }
    }
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addFiles, collapsible, reveal]);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      void addFiles(e.dataTransfer.files);
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
  const busy = items.some((it) => it.status === "converting");
  const device = useMemo(
    () => detectDevice(targetIsBig(selectedTo)),
    [targetIsBig, selectedTo],
  );

  /* ---- swap direction: reverse the conversion (To becomes From, etc.) ---- */
  // Resolve a concrete "from": the manual/detected source (AUTO before any file).
  const resolvedFrom = selectedFrom !== AUTO ? selectedFrom : items[0]?.fromId ?? null;
  const swapFrom = selectedTo; // new source = current target
  const swapTo = resolvedFrom; // new target = current source
  const canSwap =
    !lockedFrom &&
    !!swapTo &&
    swapFrom !== swapTo &&
    sources.some((s) => s.id === swapFrom) &&
    targets.some((t) => t.id === swapTo) &&
    !!engineMap[`${swapFrom}-${swapTo}`];
  const swapTitle = !resolvedFrom
    ? "Drop a file or pick a source format first to swap direction"
    : !canSwap
      ? "This conversion can't be reversed"
      : `Swap direction — ${swapFrom.toUpperCase()} to ${(swapTo ?? "").toUpperCase()}`;

  const doSwap = () => {
    if (!canSwap || !swapTo) return;
    // Direction reversed, so existing files no longer match the new source: clear them.
    runTokenRef.current++;
    itemsRef.current.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      it.outputs.forEach((o) => URL.revokeObjectURL(o.url));
    });
    setItems([]);
    setError("");
    setInfo("");
    if (inputRef.current) inputRef.current.value = "";
    manualFromRef.current = true;
    setSelectedFrom(swapFrom);
    setSelectedTo(swapTo);
  };

  /* ---- collapsed cover (homepage only, before first interaction) ---- */
  if (collapsible && !revealed) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label="Start converting a file"
        onClick={reveal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            reveal();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          reveal();
          void addFiles(e.dataTransfer.files);
        }}
        className={[
          "flex w-full cursor-pointer flex-col items-center justify-center px-8 py-14 text-center",
          "rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200",
          dragging
            ? "border-accent bg-accent-soft"
            : "border-mist bg-surface-1 hover:border-accent",
        ].join(" ")}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 16V4" />
            <path d="m6 10 6-6 6 6" />
            <path d="M4 20h16" />
          </svg>
        </div>
        <p className="font-display text-2xl text-ink">
          Convert a file
        </p>
        <p className="mt-1.5 text-stone">
          Tap to choose a file — or drop it here
        </p>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg
            className="animate-wifi-pulse"
            width="13"
            height="13"
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
      </div>
    );
  }

  return (
    <div className={["w-full", justRevealed ? "animate-console-pop" : ""].join(" ")}>
      <div className={collapsible ? "animate-reveal" : ""}>
        {/* ---- control bar: From -> To ---- */}
        <div className="mb-4 flex flex-wrap items-end justify-center gap-3 sm:gap-4">
          {lockedFrom ? (
            <>
              <div className="flex flex-col">
                <span className="mb-1.5 font-display text-sm font-medium text-ink">
                  From
                </span>
                <span className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-mist bg-surface-2 px-4 py-3 text-sm font-medium text-ink">
                  <FormatGlyph format={lockedFrom} className="h-4 w-4 text-accent" />
                  {lockedFromName ?? lockedFrom.toUpperCase()}
                </span>
              </div>
              <ArrowRight />
            </>
          ) : (
            <>
              <Dropdown
                label="Convert from"
                ariaLabel="Source format"
                options={fromOptions}
                value={selectedFrom}
                onChange={changeFrom}
                className="w-40"
              />
              <SwapButton onClick={doSwap} disabled={!canSwap} title={swapTitle} />
            </>
          )}
          <Dropdown
            label={lockedFrom ? "To" : "Convert to"}
            ariaLabel="Target format"
            options={targetOptions}
            value={selectedTo}
            onChange={changeTarget}
            className="w-40"
          />
        </div>

        {/* ---- file-first drop zone (the hero) ---- */}
        <div
          role="button"
          tabIndex={0}
          aria-label={`Add files to convert to ${targetName}`}
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
            accept={accept}
            multiple
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
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
              <path d="M12 16V4" />
              <path d="m6 10 6-6 6 6" />
              <path d="M4 20h16" />
            </svg>
          </div>

          <p
            className={[
              "font-display text-ink",
              hasItems ? "text-base" : "text-xl",
            ].join(" ")}
          >
            {hasItems
              ? "Add more files"
              : `Add your ${lockedFromName ?? "file"}${lockedFrom ? "" : "s"}`}
          </p>
          {!hasItems && (
            <p className="mt-1 text-sm text-stone">
              Tap to choose — or drop {lockedFrom ? "it" : "them"} here. Converted to {targetName} on your device.
            </p>
          )}
          {!hasItems && device.lowMemory && (
            <p className="mt-3 text-xs text-stone">
              Optimised for this device: up to {device.maxFiles} file(s),{" "}
              {prettyBytes(device.maxFileBytes)} each.
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
          Nothing is uploaded. Your files never leave this browser. You can even
          paste an image with Ctrl/Cmd+V.
        </p>

        {error && (
          <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        {info && (
          <div className="mt-4 rounded-[var(--radius-md)] border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
            {info}
          </div>
        )}

        {/* ---- file cards ---- */}
        {hasItems && (
          <div className="mt-6 space-y-3">
            {items.map((item, idx) => (
              <FileCard
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
                Add more files
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowRight() {
  return (
    <div aria-hidden="true" className="pb-3 text-stone">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    </div>
  );
}

function SwapButton({
  onClick,
  disabled,
  title,
}: {
  onClick: () => void;
  disabled: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Swap conversion direction"
      title={title}
      className={[
        "mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
        disabled
          ? "cursor-not-allowed border-mist text-faint"
          : "border-mist text-stone hover:border-accent hover:text-accent",
      ].join(" ")}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m8 3-4 4 4 4" />
        <path d="M4 7h16" />
        <path d="m16 21 4-4-4-4" />
        <path d="M20 17H4" />
      </svg>
    </button>
  );
}

/* =================== file card =================== */

function savingsPct(orig: number, out: number): number | null {
  if (!orig || !out) return null;
  return Math.round((1 - out / orig) * 100);
}

interface FileCardProps {
  item: FileItem;
  index: number;
  onRemove: () => void;
}

function FileCard({ item, index, onRemove }: FileCardProps) {
  const { file, status, previewUrl } = item;
  const single = item.outputs.length === 1 ? item.outputs[0] : null;
  const multi = item.outputs.length > 1;
  const pct =
    status === "done" && single ? savingsPct(file.size, item.outBytes) : null;

  const thumbUrl =
    status === "done" && item.resultThumbUrl ? item.resultThumbUrl : previewUrl;

  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [thumbUrl]);
  const showImg = !!thumbUrl && !imgError;

  return (
    <div
      className="animate-card-in flex items-center gap-4 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 shadow-[var(--shadow-1)] sm:p-4"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      {/* preview / glyph */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-mist bg-canvas">
        {showImg ? (
          <img
            src={thumbUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone">
            <FormatGlyph format={item.fromId} className="h-6 w-6" />
          </div>
        )}
        {status === "converting" && (
          <div className="bg-canvas/60 absolute inset-0 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-mist border-t-accent" />
          </div>
        )}
      </div>

      {/* meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{file.name}</p>

        {status === "converting" && (
          <div className="mt-1.5">
            <p className="truncate text-xs text-stone">{item.progressLabel}</p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-mist">
              <div className="animate-progress-sweep h-full w-1/3 rounded-full bg-accent" />
            </div>
          </div>
        )}

        {status === "preview" && (
          <p className="mt-1 text-xs text-stone">
            <span className="font-medium text-stone">
              {item.fromId.toUpperCase()}
            </span>{" "}
            · {prettyBytes(file.size)} · queued
          </p>
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
            </span>
            {pct !== null && pct > 0 && (
              <span className="animate-settle rounded-full bg-accent-soft px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                {pct}% smaller
              </span>
            )}
            {pct !== null && pct <= 0 && (
              <span className="rounded-full bg-brass-soft px-2 py-0.5 font-mono text-xs font-semibold text-brass">
                {Math.abs(pct)}% larger
              </span>
            )}
            {multi && (
              <span className="font-mono text-xs text-stone">
                {item.outputs.length} files · {prettyBytes(item.outBytes)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* action */}
      <div className="flex shrink-0 items-center gap-1.5">
        {status === "done" && single && (
          <a
            href={single.url}
            download={single.result.filename}
            className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
          >
            Download
          </a>
        )}
        {status === "done" && multi && (
          <div className="flex max-w-[160px] flex-wrap justify-end gap-1.5">
            {item.outputs.map((o, i) => (
              <a
                key={i}
                href={o.url}
                download={o.result.filename}
                className="rounded-full border border-mist bg-surface-1 px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-accent"
              >
                {i + 1}
              </a>
            ))}
          </div>
        )}
        {status !== "converting" && (
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
