import { useState } from "react";
import CustomSelect, { type SelectOption } from "./CustomSelect";

interface FormatOption {
  id: string;
  name: string;
  category?: "image" | "document" | "audio";
}

interface Props {
  sources: FormatOption[];
  targets: FormatOption[];
  defaultFrom?: string;
  defaultTo?: string;
  comingSoon?: boolean;
}

export default function FormatPicker({
  sources,
  targets,
  defaultFrom,
  defaultTo,
  comingSoon,
}: Props) {
  const [from, setFrom] = useState(defaultFrom ?? sources[0]?.id ?? "");
  const [to, setTo] = useState(defaultTo ?? targets[0]?.id ?? "");
  const [message, setMessage] = useState("");

  const sameFormat = from === to;

  const sourceOptions: SelectOption[] = sources.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
  }));

  const targetOptions: SelectOption[] = targets.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
  }));

  function handleFromChange(value: string) {
    setFrom(value);
    setMessage("");
  }

  function handleToChange(value: string) {
    setTo(value);
    setMessage("");
  }

  function handleConvert() {
    if (!from || !to || sameFormat) return;

    if (comingSoon) {
      setMessage(`${from.toUpperCase()} to ${to.toUpperCase()} conversion is coming soon.`);
      return;
    }

    window.location.href = `/${from}-to-${to}`;
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-mist bg-paper p-6 sm:p-8">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {/* From dropdown */}
        <div className="w-full sm:flex-1">
          <CustomSelect
            options={sourceOptions}
            value={from}
            onChange={handleFromChange}
            label="From"
            id="format-from"
          />
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
          <CustomSelect
            options={targetOptions}
            value={to}
            onChange={handleToChange}
            label="To"
            id="format-to"
          />
        </div>

        {/* Convert button */}
        <div className="w-full pt-0 sm:w-auto sm:pt-5">
          <button
            onClick={handleConvert}
            disabled={!from || !to || sameFormat}
            className="w-full rounded-full bg-accent px-8 py-3 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            Convert
          </button>
        </div>
      </div>

      {sameFormat && (
        <p className="mt-3 text-center text-xs font-medium text-amber-700">
          Choose different formats
        </p>
      )}

      {message && (
        <p className="mt-3 text-center text-xs font-medium text-accent">
          {message}
        </p>
      )}

      <p className="mt-5 text-center text-xs text-stone">
        Nothing is uploaded. Conversion happens on your device.
      </p>
    </div>
  );
}
