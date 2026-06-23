import { useState } from "react";
import Dropdown, { type DropdownOption } from "./Dropdown";

interface FormatOption {
  id: string;
  name: string;
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

  // Disable the option on each side that matches the other side, so the user
  // can't pick an identity conversion in the first place.
  const sourceOptions: DropdownOption[] = sources.map((s) => ({
    ...s,
    disabled: s.id === to,
  }));
  const targetOptions: DropdownOption[] = targets.map((t) => ({
    ...t,
    disabled: t.id === from,
  }));

  function handleConvert() {
    if (!from || !to || sameFormat) return;

    if (comingSoon) {
      setMessage(`${from.toUpperCase()} to ${to.toUpperCase()} conversion is coming soon.`);
      return;
    }

    window.location.href = `/${from}-to-${to}`;
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-mist bg-surface-1 p-6 shadow-[var(--shadow-2)] sm:p-8">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:gap-5">
        {/* From */}
        <div className="w-full sm:flex-1">
          <Dropdown
            label="From"
            ariaLabel="Source format"
            options={sourceOptions}
            value={from}
            onChange={(id) => {
              setFrom(id);
              setMessage("");
            }}
          />
        </div>

        {/* Arrow */}
        <div
          aria-hidden="true"
          className="hidden shrink-0 pb-3 text-stone sm:block"
        >
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

        {/* To */}
        <div className="w-full sm:flex-1">
          <Dropdown
            label="To"
            ariaLabel="Target format"
            options={targetOptions}
            value={to}
            onChange={(id) => {
              setTo(id);
              setMessage("");
            }}
          />
        </div>

        {/* Convert */}
        <div className="w-full sm:w-auto">
          <button
            onClick={handleConvert}
            disabled={!from || !to || sameFormat}
            className="w-full rounded-full bg-accent px-8 py-3 text-sm font-medium text-canvas transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            Convert
          </button>
        </div>
      </div>

      {sameFormat && (
        <p className="mt-3 text-center text-xs font-medium text-danger">
          Choose two different formats
        </p>
      )}

      {message && (
        <p className="mt-3 text-center text-xs font-medium text-accent">
          {message}
        </p>
      )}

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-stone">
        <svg
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
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Nothing is uploaded. Conversion happens on your device.
      </p>
    </div>
  );
}
