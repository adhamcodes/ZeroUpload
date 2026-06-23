import { useState } from "react";

interface FormatOption {
  id: string;
  name: string;
}

interface Props {
  sources: FormatOption[];
  targets: FormatOption[];
  defaultFrom?: string;
  defaultTo?: string;
}

export default function FormatPicker({
  sources,
  targets,
  defaultFrom,
  defaultTo,
}: Props) {
  const [from, setFrom] = useState(defaultFrom ?? sources[0]?.id ?? "");
  const [to, setTo] = useState(defaultTo ?? targets[0]?.id ?? "");

  function handleConvert() {
    if (from && to && from !== to) {
      window.location.href = `/${from}-to-${to}`;
    }
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-mist bg-paper p-6 sm:p-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {/* From dropdown */}
        <div className="w-full sm:flex-1">
          <label className="mb-1.5 block font-display text-sm font-medium text-ink">
            From
          </label>
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-[var(--radius-xl)] border border-mist bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Arrow */}
        <div className="hidden pt-5 text-stone sm:block">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>

        {/* To dropdown */}
        <div className="w-full sm:flex-1">
          <label className="mb-1.5 block font-display text-sm font-medium text-ink">
            To
          </label>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-[var(--radius-xl)] border border-mist bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
          >
            {targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Convert button */}
        <div className="w-full pt-0 sm:w-auto sm:pt-5">
          <button
            onClick={handleConvert}
            disabled={!from || !to || from === to}
            className="w-full rounded-full bg-accent px-8 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            Convert
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-stone">
        Nothing is uploaded. Conversion happens on your device.
      </p>
    </div>
  );
}
