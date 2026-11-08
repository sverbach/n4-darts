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
      className="border-accent bg-bg kiosk:p-6 fixed inset-0 z-20 flex items-center justify-center overflow-y-auto border-[3px] border-solid p-4"
      role="dialog"
      aria-label={name}
    >
      <div className="kiosk:gap-6 flex max-h-full w-full max-w-[1180px] flex-col gap-4">
        <div className="border-border flex items-end justify-between gap-4 border-0 border-b border-solid pb-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="kiosk:text-[48px] kiosk:tracking-[3px] text-[26px] tracking-[2px]">
              {title}
              {dart && (
                <span className="font-text ml-[0.4em] tracking-normal normal-case">{dart}</span>
              )}
            </h2>
            {context && <span className="label kiosk:text-[13px]">{context}</span>}
          </div>
          <button
            type="button"
            className="ghost kiosk:min-h-16 kiosk:px-6 kiosk:text-[16px]"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
        <div className="kiosk:gap-3 grid grid-cols-[repeat(3,1fr)] gap-2">
          {MULTIPLIERS.map((m) => (
            <button
              type="button"
              key={m.value}
              aria-pressed={multiplier === m.value}
              onClick={() => setMultiplier(m.value)}
              className="kiosk:min-h-20 kiosk:text-[20px] kiosk:tracking-[2px] aria-pressed:text-accent min-h-14 text-[13px] aria-pressed:font-bold"
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="kiosk:grid-cols-[repeat(10,1fr)] kiosk:gap-2.5 grid grid-cols-[repeat(4,1fr)] gap-2">
          {NUMBERS.map((n) => (
            <button
              type="button"
              key={n}
              className={`kiosk:min-h-[104px] font-text kiosk:text-[56px] min-h-16 p-0 text-[36px] tracking-normal ${isCurrent({ number: n, multiplier }) ? CURRENT : ""}`}
              onClick={() => onPick({ number: n, multiplier })}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="kiosk:gap-2.5 grid grid-cols-[repeat(3,1fr)] gap-2">
          <button
            type="button"
            className={`kiosk:min-h-24 font-text kiosk:text-[56px] min-h-16 p-0 text-[36px] tracking-normal ${isCurrent({ number: 25, multiplier: 1 }) ? CURRENT : ""}`}
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
