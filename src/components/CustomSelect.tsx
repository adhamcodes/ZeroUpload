import { useState, useRef, useEffect, useCallback, useId } from "react";

export interface SelectOption {
  id: string;
  name: string;
  /** Optional category hint for icon selection: "image" | "document" | "audio" */
  category?: "image" | "document" | "audio";
}

interface Props {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  id?: string;
}

/** Inline SVG icon for image formats (mountain/sun scene). */
function ImageIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.5-3.5L11 18" />
    </svg>
  );
}

/** Inline SVG icon for document formats (page with fold). */
function DocumentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

/** Inline SVG icon for audio formats (music note). */
function AudioIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

/** Returns the icon component matching a format category. */
function FormatIcon({ category }: { category?: string }) {
  switch (category) {
    case "audio":
      return <AudioIcon />;
    case "document":
      return <DocumentIcon />;
    default:
      return <ImageIcon />;
  }
}

export default function CustomSelect({
  options,
  value,
  onChange,
  label,
  id: externalId,
}: Props) {
  const generatedId = useId();
  const baseId = externalId ?? generatedId;
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Prevent background scroll on mobile when open
  useEffect(() => {
    if (!isOpen) return;
    const isMobile = window.innerWidth < 640;
    if (!isMobile) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const openDropdown = useCallback(() => {
    setIsOpen(true);
    const idx = options.findIndex((o) => o.id === value);
    setActiveIndex(idx >= 0 ? idx : 0);
  }, [options, value]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (optionId: string) => {
      onChange(optionId);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "ArrowUp":
          e.preventDefault();
          openDropdown();
          break;
      }
    },
    [openDropdown],
  );

  const handleListboxKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
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
          if (activeIndex >= 0 && activeIndex < options.length) {
            selectOption(options[activeIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "Tab":
          // Tab moves focus away, close dropdown
          setIsOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [options, activeIndex, selectOption, closeDropdown],
  );

  // Scroll active option into view
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    const listbox = listboxRef.current;
    if (!listbox) return;
    const activeEl = listbox.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex]);

  const activeDescendantId =
    activeIndex >= 0 ? `${baseId}-option-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      <label
        id={`${baseId}-label`}
        htmlFor={triggerId}
        className="mb-1.5 block font-display text-sm font-medium text-ink"
      >
        {label}
      </label>

      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={`${baseId}-label`}
        aria-activedescendant={isOpen ? activeDescendantId : undefined}
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        onKeyDown={isOpen ? handleListboxKeyDown : handleTriggerKeyDown}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[var(--radius-xl)] border border-mist bg-canvas px-4 py-3 text-left text-sm text-ink outline-none transition-colors focus:border-accent"
      >
        <span className="flex items-center gap-2">
          {selectedOption && (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
              <FormatIcon category={selectedOption.category} />
            </span>
          )}
          <span>{selectedOption?.name ?? "Select..."}</span>
        </span>

        {/* Chevron */}
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
          className={`shrink-0 text-stone transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown listbox */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={`${baseId}-label`}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-[var(--radius-xl)] border border-mist bg-paper shadow-[var(--shadow-lifted)]"
        >
          {options.map((option, index) => {
            const isSelected = option.id === value;
            const isActive = index === activeIndex;

            return (
              <li
                key={option.id}
                id={`${baseId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => {
                  // Prevent blur on trigger
                  e.preventDefault();
                }}
                onClick={() => selectOption(option.id)}
                className={[
                  "flex min-h-[44px] cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  isActive ? "bg-accent-soft" : "",
                  isSelected && !isActive ? "font-medium text-accent" : "text-ink",
                ].join(" ")}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                  <FormatIcon category={option.category} />
                </span>
                <span>{option.name}</span>
                {isSelected && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="ml-auto shrink-0 text-accent"
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
