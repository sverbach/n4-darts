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
  /** The dart in the title ("T20" in "Correct T20"), set in the numbers' font. */
  dart?: string;
  /** Above the title, e.g. "Ann · Dart 2". */
  context?: string;
  /** The dart's current value, marked in the grid. */
  current?: Segment;
  onPick(segment: Segment): void;
  onCancel(): void;
}

/** Full-screen picker for correcting a dart: pick single/double/triple, then the number. */
/** The segment the dart is on now, framed. */
const CURRENT = "border-[3px] border-accent border-solid bg-accent-tint text-accent";
/** 25, Bull and Miss. */
const EXTRA = "min-h-16 p-0 font-pixel text-[13px] tracking-[2px] kiosk:min-h-24 kiosk:text-[22px]";

export function SegmentPicker({ title, dart, context, current, onPick, onCancel }: Props) {
  const name = dart ? `${title} ${dart}` : title;
  const start = current && current.number !== 25 && current.multiplier > 0 ? current.multiplier : 1;
  const [multiplier, setMultiplier] = useState<1 | 2 | 3>(start as 1 | 2 | 3);
  const isCurrent = (segment: Segment) =>
    current?.number === segment.number && current.multiplier === segment.multiplier;

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto border-[3px] border-accent border-solid bg-bg kiosk:p-6 p-4"
      role="dialog"
      aria-label={name}
    >
      <div className="flex max-h-full w-full max-w-[1180px] flex-col gap-4 kiosk:gap-6">
        <div className="flex items-end justify-between gap-4 border-0 border-border border-b border-solid pb-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="kiosk:text-[48px] text-[26px] kiosk:tracking-[3px] tracking-[2px]">
              {title}
              {dart && (
                <span className="ml-[0.4em] font-text normal-case tracking-normal">{dart}</span>
              )}
            </h2>
            {context && <span className="label kiosk:text-[13px]">{context}</span>}
          </div>
          {/* Leaving changes nothing, so it's quiet, not red. */}
          <button
            type="button"
            className="ghost kiosk:min-h-16 kiosk:px-6 kiosk:text-[16px]"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
        <div className="grid grid-cols-[repeat(3,1fr)] gap-2 kiosk:gap-3">
          {MULTIPLIERS.map((m) => (
            <button
              type="button"
              key={m.value}
              aria-pressed={multiplier === m.value}
              onClick={() => setMultiplier(m.value)}
              // Square, with the pressed state of every toggle; the slant is the CTA's alone.
              className="kiosk:min-h-20 min-h-14 kiosk:text-[20px] text-[13px] kiosk:tracking-[2px] aria-pressed:font-bold aria-pressed:text-accent"
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(4,1fr)] kiosk:grid-cols-[repeat(10,1fr)] gap-2 kiosk:gap-2.5">
          {NUMBERS.map((n) => (
            <button
              type="button"
              key={n}
              className={`kiosk:min-h-[104px] min-h-16 p-0 font-text kiosk:text-[56px] text-[36px] tracking-normal ${isCurrent({ number: n, multiplier }) ? CURRENT : ""}`}
              onClick={() => onPick({ number: n, multiplier })}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[repeat(3,1fr)] gap-2 kiosk:gap-2.5">
          <button
            type="button"
            // A number, so in the numbers' font like 1–20 (DESIGN.md: the Two-Voice Rule).
            className={`kiosk:min-h-24 min-h-16 p-0 font-text kiosk:text-[56px] text-[36px] tracking-normal ${isCurrent({ number: 25, multiplier: 1 }) ? CURRENT : ""}`}
            onClick={() => onPick({ number: 25, multiplier: 1 })}
          >
            25
          </button>
          <button
            type="button"
            className={`${EXTRA} ${isCurrent({ number: 25, multiplier: 2 }) ? CURRENT : ""}`}
            onClick={() => onPick({ number: 25, multiplier: 2 })}
          >
            Bull
          </button>
          <button
            type="button"
            className={`${EXTRA} ${isCurrent({ number: 0, multiplier: 0 }) ? CURRENT : ""}`}
            onClick={() => onPick({ number: 0, multiplier: 0 })}
          >
            Miss
          </button>
        </div>
      </div>
    </div>
  );
}
