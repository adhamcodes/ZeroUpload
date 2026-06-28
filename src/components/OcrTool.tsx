import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { ocrImage, ocrSupported, type OcrProgress } from "../lib/engines/ocr";

const ACCEPT = ".jpg,.jpeg,.png,.webp,.bmp,.gif,image/*";
const MAX_BYTES = 25 * 1024 * 1024;

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<OcrProgress | null>(null);
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);
  const [modelReady, setModelReady] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const prevRef = useRef<string | null>(null);
  prevRef.current = previewUrl;

  useEffect(() => setSupported(ocrSupported()), []);

  const clearOutput = useCallback(() => {
    setText("");
    setConfidence(null);
    setError("");
    setCopied(false);
  }, []);

  const run = useCallback(async (f: File) => {
    clearOutput();
    setBusy(true);
    setPhase({ stage: "load", label: "Preparing…" });
    try {
      const res = await ocrImage(f, (p) => setPhase(p));
      setModelReady(true);
      setText(res.text);
      setConfidence(res.confidence);
      if (!res.text) setError("No readable text was found in this image. Try a clearer, higher-contrast image.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read text from that image.");
    } finally {
      setBusy(false);
      setPhase(null);
    }
  }, [clearOutput]);

  const load = useCallback((f: File) => {
    if (!/\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name) && !/^image\//.test(f.type)) {
      setError("Please choose an image (JPG, PNG, WEBP, BMP or GIF).");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`That image is ${prettyBytes(f.size)} — the limit is ${prettyBytes(MAX_BYTES)}.`);
      return;
    }
    clearOutput();
    if (prevRef.current) URL.revokeObjectURL(prevRef.current);
    setPreviewUrl(URL.createObjectURL(f));
    setFile(f);
    void run(f);
  }, [clearOutput, run]);

  const addFiles = useCallback((list: FileList | null) => { if (list && list[0]) load(list[0]); }, [load]);

  const reset = useCallback(() => {
    clearOutput();
    if (prevRef.current) URL.revokeObjectURL(prevRef.current);
    setPreviewUrl(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [clearOutput]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Couldn't copy — your browser blocked clipboard access. Select the text and copy manually.");
    }
  }, [text]);

  const downloadUrl = text ? URL.createObjectURL(new Blob([text], { type: "text/plain" })) : null;
  const dlRef = useRef<string | null>(null);
  useEffect(() => {
    if (dlRef.current) URL.revokeObjectURL(dlRef.current);
    dlRef.current = downloadUrl;
    return () => { if (dlRef.current) URL.revokeObjectURL(dlRef.current); };
  }, [downloadUrl]);

  useEffect(() => () => { if (prevRef.current) URL.revokeObjectURL(prevRef.current); }, []);

  const onDrop = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }, [addFiles]);
  const onKey = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } };

  if (!supported) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-6 text-center text-stone">
        Your browser can't run the on-device OCR engine. Please try a recent version of Chrome, Edge, or Firefox.
      </div>
    );
  }

  if (!file) {
    return (
      <div className="w-full">
        <div role="button" tabIndex={0} aria-label="Add an image to extract text from" onClick={() => inputRef.current?.click()} onKeyDown={onKey}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          className={["relative flex w-full cursor-pointer flex-col items-center justify-center px-8 py-16 text-center rounded-[var(--radius-xl)] border-2 border-dashed transition-colors duration-200", dragging ? "border-accent bg-accent-soft" : "border-mist bg-surface-1 hover:border-accent"].join(" ")}>
          <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7V5a1 1 0 0 1 1-1h2" /><path d="M4 17v2a1 1 0 0 0 1 1h2" /><path d="M17 4h2a1 1 0 0 1 1 1v2" /><path d="M17 20h2a1 1 0 0 0 1-1v-2" /><path d="M7 8h10" /><path d="M7 12h10" /><path d="M7 16h6" /></svg>
          </div>
          <p className="font-display text-xl text-ink">Drop an image with text</p>
          <p className="mt-1 text-sm text-stone">or click to choose — read on your device</p>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
          <svg className="animate-wifi-pulse" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
          Nothing is uploaded. Your image never leaves this browser.
        </p>
        {!modelReady && <p className="mt-2 text-center text-xs text-faint">First use sets up the secure on-device OCR engine (a one-time download) — then it's instant, and your image never leaves your device.</p>}
        {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-mist bg-surface-2 p-3 sm:p-4">
        {previewUrl && <img src={previewUrl} alt="" className="bg-canvas h-12 w-12 shrink-0 rounded-[var(--radius-md)] border border-mist object-contain" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{file.name}</p>
          <p className="text-xs text-stone">{prettyBytes(file.size)}{confidence != null && ` · ${confidence}% confidence`}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {text && !busy && <button onClick={() => run(file)} className="text-sm text-stone underline-offset-4 hover:text-ink hover:underline">Re-run</button>}
          <button onClick={reset} className="text-sm text-stone underline-offset-4 transition-colors hover:text-ink hover:underline">Change</button>
        </div>
      </div>

      {phase && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent">
          <p>{phase.label}</p>
          {typeof phase.pct === "number" && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${Math.max(2, phase.pct)}%` }} />
            </div>
          )}
        </div>
      )}

      {error && <div className="mt-4 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</div>}

      {text && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="ocr-out" className="text-sm font-medium text-ink">Extracted text</label>
            <div className="flex items-center gap-3">
              <button onClick={copy} className="text-sm font-medium text-accent underline-offset-4 hover:underline">{copied ? "Copied!" : "Copy"}</button>
              {downloadUrl && <a href={downloadUrl} download={`${file.name.replace(/\.[^.]+$/, "")}.txt`} className="text-sm font-medium text-accent underline-offset-4 hover:underline">Download .txt</a>}
            </div>
          </div>
          <textarea id="ocr-out" value={text} onChange={(e) => setText(e.target.value)} rows={12}
            className="w-full resize-y rounded-[var(--radius-md)] border border-mist bg-surface-1 p-4 font-mono text-sm text-ink focus:border-accent focus:outline-none" />
          <p className="mt-2 text-xs text-stone">You can edit the text above before copying or downloading. OCR isn't perfect — proofread important results.</p>
        </div>
      )}
    </div>
  );
}
