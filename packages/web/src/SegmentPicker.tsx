import type { Segment } from "@n4/engine";
import { useState } from "react";

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);
const MULTIPLIERS = [
  { value: 1, label: "Single" },
  { value: 2, label: "Double" },
  { value: 3, label: "Triple" },
] as const;

interface Props {
  title: string;
  onPick(segment: Segment): void;
  onCancel(): void;
}

/** Full-screen picker for correcting a dart: pick single/double/triple, then the number. */
export function SegmentPicker({ title, onPick, onCancel }: Props) {
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(1);

  return (
    <div className="overlay" role="dialog" aria-label={title}>
      <div className="picker">
        <div className="picker-head">
          <h2>{title}</h2>
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
        <div className="segmented">
          {MULTIPLIERS.map((m) => (
            <button
              type="button"
              key={m.value}
              aria-pressed={multiplier === m.value}
              onClick={() => setMultiplier(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="number-grid">
          {NUMBERS.map((n) => (
            <button type="button" key={n} onClick={() => onPick({ number: n, multiplier })}>
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={multiplier === 3}
            onClick={() => onPick({ number: 25, multiplier: multiplier === 2 ? 2 : 1 })}
          >
            {multiplier === 2 ? "Bull" : "25"}
          </button>
          <button type="button" onClick={() => onPick({ number: 0, multiplier: 0 })}>
            Miss
          </button>
        </div>
      </div>
    </div>
  );
}
