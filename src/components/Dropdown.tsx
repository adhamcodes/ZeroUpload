import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import FormatGlyph from "./FormatGlyph";

export interface DropdownOption {
  id: string;
  name: string;
  /** optional secondary line shown under the name */
  hint?: string;
  /** disable selection of this option (e.g. same as source) */
  disabled?: boolean;
}

interface Props {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  /** visible field label */
  label?: string;
  /** aria-label when there is no visible label */
  ariaLabel?: string;
  disabled?: boolean;
  /** show a FormatGlyph next to each option (default true) */
  withGlyph?: boolean;
  /** size variant */
  size?: "md" | "lg";
  id?: string;
  className?: string;
}

/**
 * Dropdown — a fully custom, accessible replacement for native <select>.
 *
 * Native selects are the #1 "cheap" tell and cannot be styled to match the
 * Atelier system. This implements the listbox pattern with roving focus:
 *  - trigger: aria-haspopup="listbox" + aria-expanded, opens on Enter/Space/Arrow
 *  - menu: role="listbox"; options role="option" with aria-selected
 *  - keyboard: Up/Down, Home/End, Enter/Space to select, Esc to close,
 *    Tab to close-and-move-on, plus type-ahead
 *  - focus returns to the trigger on close; click-outside closes
 *  - respects prefers-reduced-motion (entrance animation is CSS-guarded)
 */
export default function Dropdown({
  options,
  value,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  withGlyph = true,
  size = "md",
  id,
  className,
}: Props) {
  const reactId = useId();
  const baseId = id ?? reactId;
  const triggerId = `${baseId}-trigger`;
  const listId = `${baseId}-list`;
  const labelId = label ? `${baseId}-label` : undefined;

  const [open, setOpen] = useState(false);
  const indexOfValue = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const [activeIndex, setActiveIndex] = useState(indexOfValue);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const typeahead = useRef<{ str: string; at: number }>({ str: "", at: 0 });

  const selected = options.find((o) => o.id === value) ?? options[0];

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setActiveIndex(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  }, [disabled, options, value]);

  // Move focus onto the active option whenever it changes while open.
  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  // Close on outside pointer interaction.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const commit = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt || opt.disabled) return;
      onChange(opt.id);
      close();
    },
    [options, onChange, close],
  );

  const step = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        const n = options.length;
        let next = current;
        // skip disabled options
        for (let i = 0; i < n; i++) {
          next = (next + delta + n) % n;
          if (!options[next]?.disabled) break;
        }
        return next;
      });
    },
    [options],
  );

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        e.preventDefault();
        openMenu();
        break;
      default:
        break;
    }
  }

  function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        step(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        step(-1);
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const now = Date.now();
          const t = typeahead.current;
          t.str = now - t.at > 600 ? e.key : t.str + e.key;
          t.at = now;
          const q = t.str.toLowerCase();
          const found = options.findIndex((o) =>
            o.name.toLowerCase().startsWith(q),
          );
          if (found >= 0) setActiveIndex(found);
        }
        break;
    }
  }

  const triggerPad = size === "lg" ? "px-4 py-3.5 text-base" : "px-4 py-3 text-sm";

  return (
    <div ref={rootRef} className={["relative", className ?? ""].join(" ")}>
      {label && (
        <span
          id={labelId}
          className="mb-1.5 block font-display text-sm font-medium text-ink"
        >
          {label}
        </span>
      )}

      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelId ? `${labelId} ${triggerId}` : undefined}
        aria-label={labelId ? undefined : ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-surface-1",
          triggerPad,
          "text-ink transition-colors duration-150",
          open ? "border-accent" : "border-mist hover:border-mist-strong",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {withGlyph && selected && (
            <FormatGlyph
              format={selected.id}
              className="h-4 w-4 shrink-0 text-accent"
            />
          )}
          <span className="truncate font-medium">{selected?.name ?? "Select"}</span>
        </span>
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
          className={[
            "shrink-0 text-stone transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          onKeyDown={onListKeyDown}
          className={[
            "animate-card-in absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-auto",
            "rounded-[var(--radius-md)] border border-mist bg-surface-3 p-1.5",
            "shadow-[var(--shadow-3)] origin-top",
          ].join(" ")}
        >
          {options.map((opt, i) => {
            const isSelected = opt.id === value;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.id}
                id={`${baseId}-opt-${i}`}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                tabIndex={-1}
                onClick={() => commit(i)}
                onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                className={[
                  "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2.5 outline-none",
                  opt.disabled
                    ? "cursor-not-allowed text-faint"
                    : "cursor-pointer",
                  isActive && !opt.disabled
                    ? "bg-accent-soft text-accent"
                    : "text-ink",
                ].join(" ")}
              >
                {withGlyph && (
                  <FormatGlyph
                    format={opt.id}
                    className={[
                      "h-4 w-4 shrink-0",
                      isActive && !opt.disabled ? "text-accent" : "text-stone",
                    ].join(" ")}
                  />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {opt.name}
                  </span>
                  {opt.hint && (
                    <span className="block truncate text-xs text-stone">
                      {opt.hint}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0 text-accent"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
