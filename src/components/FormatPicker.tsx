interface QuickChip {
  from: string;
  to: string;
  label: string;
}

interface Props {
  /** Optional quick-chip shortcuts for popular conversions */
  quickChips?: QuickChip[];
}

export default function FormatPicker({ quickChips }: Props) {
  if (!quickChips || quickChips.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="mb-2 text-xs font-medium text-stone">Popular conversions</p>
      <div className="flex flex-wrap gap-2">
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
  );
}
