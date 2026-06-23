/**
 * FormatGlyph — a small line-icon for a file format, matched by format id.
 *
 * Pure presentation. Reused by the custom Dropdown (target picker) and the
 * file-first preview cards as a tasteful fallback when no raster preview is
 * available. Icons inherit `currentColor` so the parent controls the tint.
 */

export type FormatKind = "image" | "vector" | "doc" | "audio" | "text";

const IMAGE_FORMATS = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp", "heic", "heif"]);
const AUDIO_FORMATS = new Set(["mp3", "wav", "ogg", "m4a", "flac", "aac"]);

/** Map a format id to its visual family. */
export function formatKind(id: string): FormatKind {
  const f = id.toLowerCase();
  if (f === "svg") return "vector";
  if (f === "pdf") return "doc";
  if (f === "txt" || f === "text") return "text";
  if (AUDIO_FORMATS.has(f)) return "audio";
  if (IMAGE_FORMATS.has(f)) return "image";
  return "doc";
}

/** SVG inner markup per family (24x24 viewBox, stroke = currentColor). */
function pathsFor(kind: FormatKind): string[] {
  switch (kind) {
    case "image":
      return [
        '<rect x="3" y="3" width="18" height="18" rx="2.5"/>',
        '<circle cx="8.5" cy="8.5" r="1.6"/>',
        '<path d="m21 15-4.2-4.2L6 21"/>',
      ];
    case "vector":
      return [
        '<circle cx="6" cy="6" r="2"/>',
        '<circle cx="18" cy="18" r="2"/>',
        '<path d="M8 6h6a4 4 0 0 1 4 4v6"/>',
      ];
    case "doc":
      return [
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>',
        '<path d="M14 2v6h6"/>',
      ];
    case "audio":
      return [
        '<path d="M9 18V5l11-2v13"/>',
        '<circle cx="6" cy="18" r="3"/>',
        '<circle cx="18" cy="16" r="3"/>',
      ];
    case "text":
      return [
        '<path d="M4 7V4h16v3"/>',
        '<path d="M9 20h6"/>',
        '<path d="M12 4v16"/>',
      ];
  }
}

interface Props {
  format: string;
  className?: string;
  /** decorative by default; pass a label to expose it to assistive tech */
  title?: string;
}

export default function FormatGlyph({ format, className, title }: Props) {
  const kind = formatKind(format);
  const inner = pathsFor(kind).join("");
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title}</title>` : "") + inner }}
    />
  );
}
