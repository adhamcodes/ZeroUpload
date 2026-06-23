import { useState } from "react";

interface FormatOption {
  id: string;
  name: string;
}

interface QuickChip {
  from: string;
  to: string;
  label: string;
}

interface Props {
  sources: FormatOption[];
  targets: FormatOption[];
  defaultFrom?: string;
  defaultTo?: string;
  comingSoon?: boolean;
  quickChips?: QuickChip[];
}

export default function FormatPicker({
  sources,
  targets,
  defaultFrom,
  defaultTo,
  comingSoon,
  quickChips,
}: Props) {
  const [from, setFrom] = useState(defaultFrom || sources[0]?.id || "");
  const [to, setTo] = useState(defaultTo || targets[0]?.id || "");
  const [warning, setWarning] = useState("");

  const handleConvert = () => {
    if (comingSoon) {
      setWarning("This conversion is coming soon!");
      return;
    }
    if (from === to) {
      setWarning("Source and target formats are the same.");
      return;
    }
    setWarning("");
    window.location.href = `/${from}-to-${to}`;
  };

  const handleFromChange = (value: string) => {
    setFrom(value);
    if (warning) setWarning("");
  };

  const handleToChange = (value: string) => {
    setTo(value);
    if (warning) setWarning("");
  };

  return (
    <div className="mt-8">
      {/* Picker card */}
      <div className="mx-auto max-w-md rounded-[var(--radius-xl)] border border-mist bg-paper p-6 shadow-sm">
        <p className="mb-4 font-display text-sm font-medium text-ink">Choose your conversion</p>

        <div className="flex items-center gap-3">
          {/* From dropdown */}
          <div className="flex-1">
            <label htmlFor="format-from" className="mb-1 block text-xs font-medium text-stone">
              From
            </label>
            <select
              id="format-from"
              value={from}
              onChange={(e) => handleFromChange(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-mist bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="mt-5 flex-shrink-0 text-stone">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>

          {/* To dropdown */}
          <div className="flex-1">
            <label htmlFor="format-to" className="mb-1 block text-xs font-medium text-stone">
              To
            </label>
            <select
              id="format-to"
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-mist bg-canvas px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning message */}
        {warning && (
          <p className="mt-3 text-xs text-amber-600">{warning}</p>
        )}

        {/* Convert button */}
        <button
          onClick={handleConvert}
          className="mt-4 w-full rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-canvas transition-colors hover:opacity-90"
        >
          Convert
        </button>
      </div>

      {/* Quick chips */}
      {quickChips && quickChips.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-center text-xs font-medium text-stone">Popular conversions</p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickChips.map((chip) => (
              <a
                key={`${chip.from}-${chip.to}`}
                href={`/${chip.from}-to-${chip.to}`}
                className="rounded-full border border-mist bg-paper px-3 py-1 text-xs font-mono text-stone transition-all hover:border-brass hover:text-ink"
              >
                {chip.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Privacy note */}
      <p className="mt-5 text-center text-xs text-stone/70">
        Nothing is uploaded — conversion happens entirely on your device.
      </p>
    </div>
  );
}
