import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cropImage, type CompressFormat, type CropRect } from "../lib/imageTools";
import Dropdown, { type DropdownOption } from "./Dropdown";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.bmp,image/jpeg,image/png,image/webp,image/gif,image/bmp";
const RX = /\.(jpe?g|png|webp|gif|bmp)$/i;
const MAX_BYTES = 50 * 1024 * 1024;

const FORMAT_OPTIONS: DropdownOption[] = [
  { id: "auto", name: "Keep original" },
  { id: "jpg", name: "JPG" },
  { id: "webp", name: "WEBP" },
  { id: "png", name: "PNG" },
];
const ASPECTS: { id: string; name: string; ratio: number | null }[] = [
  { id: "free", name: "Free", ratio: null },
  { id: "1", name: "1:1", ratio: 1 },
  { id: "43", name: "4:3", ratio: 4 / 3 },
  { id: "169", name: "16:9", ratio: 16 / 9 },
];

interface Rect { x: number; y: number; w: number; h: number }
function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState("");
  const [rect, setRect] = useState<Rect | null>(null);
  const [aspect, setAspect] = useState<string>("free");
  const [format, setFormat] = useState<CompressFormat>("auto");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ url: string; name: string; bytes: number; w: number; h: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawRef = useRef<{ sx: number; sy: number } | null>(null);
  const resultRef = useRef<{ url: string } | null>(null);
  resultRef.current = result;

  const clearResult = useCallback(() => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
    setResult(null);
  }, []);

  const open = useCallback((f: File) => {
    if (!RX.test(f.name) && !/^image\//.test(f.type)) { setError("Please choose a JPG, PNG, WEBP, GIF or BMP image."); return; }
    if (f.size > MAX_BYTES) { setError(`That image is ${prettyBytes(f.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`); return; }
    setError("");
    setRect(null);
    setResult(null);
    setFile(f);
    setSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
  }, []);

  const addFiles = useCallback((list: FileList | null) => { if (list && list[0]) open(list[0]); }, [open]);

  const reset = useCallback(() => {
    clearResult();
    setRect(null);
    setFile(null);
    setSrc((prev) => { if (prev) URL.revokeObjectURL(prev); return ""; });
    if (inputRef.current) inputRef.current.value = "";
  }, [clearResult]);

  useEffect(() => () => {
    if (resultRef.current?.url) URL.revokeObjectURL(resultRef.current.url);
  }, []);

  const rel = (e: PointerEvent) => {
    const img = imgRef.current!;
    const r = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, r.width)),
      y: Math.max(0, Math.min(e.clientY - r.top, r.height)),
      w: r.width, h: r.height,
    };
  };

  const onDown = (e: PointerEvent) => {
    if (!imgRef.current) return;
    clearResult();
    const p = rel(e);
    drawRef.current = { sx: p.x, sy: p.y };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const onMove = (e: PointerEvent) => {
    if (!drawRef.current) return;
    const p = rel(e);
    const { sx, sy } = drawRef.current;
    let x = Math.min(sx, p.x), y = Math.min(sy, p.y);
    let w = Math.abs(p.x - sx), h = Math.abs(p.y - sy);
    const ar = ASPECTS.find((a) => a.id === aspect)?.ratio;
    if (ar) {
      h = w / ar;
      if (y + h > p.h) { h = p.h - y; w = h * ar; }
      if (x + w > p.w) { w = p.w - x; h = w / ar; }
    }
    setRect({ x, y, w, h });
  };
  const onUp = () => { drawRef.current = null; };

  const apply = useCallback(async () => {
    const img = imgRef.current;
    if (!file || !img || !rect || rect.w < 6 || rect.h < 6) { setError("Drag a box on the image to choose the crop area."); return; }
    setError("");
    const scaleX = img.naturalWidth / img.getBoundingClientRect().width;
    const scaleY = img.naturalHeight / img.getBoundingClientRect().height;
    const source: CropRect = { x: rect.x * scaleX, y: rect.y * scaleY, width: rect.w * scaleX, height: rect.h * scaleY };
    try {
      const res = await cropImage(file, source, { format, quality: 0.95 });
      clearResult();
      setResult({ url: URL.createObjectURL(res.blob), name: res.filename, bytes: res.blob.size, w: res.width, h: res.height });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't crop that image.");
    }
  }, [file, rect, format, clearResult]);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  if (!file) {
    return (
      <div className="w-full">
        <div role="button" tabIndex={0} aria-label="Add an image to crop" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={["relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 2v14a2 2 0 0 0 2 2h14" /><path d="M18 22V8a2 2 0 0 0-2-2H2" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop your image here</p>
          <p className="mt-1 text-sm text-stone">or click to choose — cropped on your device</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
          Nothing is uploaded. Your image never leaves this browser.
        </p>
        {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
            <button key={a.id} onClick={() => { setAspect(a.id); setRect(null); clearResult(); }}
              className={["rounded-full border px-3 py-1.5 text-sm transition-colors", aspect === a.id ? "border-accent bg-accent-soft text-accent" : "border-mist bg-surface-1 text-stone hover:text-ink hover:border-accent/60"].join(" ")}>
              {a.name}
            </button>
          ))}
        </div>
        <Dropdown label="Format" ariaLabel="Output format" options={FORMAT_OPTIONS} value={format} onChange={(v) => { setFormat(v as CompressFormat); clearResult(); }} withGlyph={false} className="w-36" />
      </div>

      <div className="relative w-full select-none overflow-hidden rounded-[var(--radius-lg)] border border-mist bg-canvas" style={{ touchAction: "none" }}>
        <img ref={imgRef} src={src} alt="" draggable={false} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}
          className="mx-auto block max-h-[60vh] w-auto max-w-full cursor-crosshair" />
        {rect && rect.w > 0 && (
          <div className="pointer-events-none absolute border-2 border-accent" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)" }} />
        )}
      </div>
      <p className="mt-2 text-center text-xs text-stone">Drag a box on the image to set the crop area.</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">New image</button>
        {result ? (
          <a href={result.url} download={result.name} className="animate-settle inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">
            Download {result.w}×{result.h} · {prettyBytes(result.bytes)}
          </a>
        ) : (
          <button onClick={apply} className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-canvas transition-opacity hover:opacity-90">Apply crop</button>
        )}
      </div>
      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
    </div>
  );
}
